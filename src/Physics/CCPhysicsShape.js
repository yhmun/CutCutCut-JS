/****************************************************************************
 Copyright (c) 2015 Young-Hwan Mun (yh.msw9@gmail.com)
 Copyright (c) 2013 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

cc.PhysicsMaterial = function ( _density, _restitution, _friction ) 
{
	if ( _density     === undefined ) _density 	   = 0;
	if ( _restitution === undefined ) _restitution = 0;
	if ( _friction 	  === undefined ) _friction    = 0;	
							
	return { density: _density, restitution: _restitution, friction: _friction };
};

cc.PhysicsMaterial.clone = function ( material ) 
{
	return { density: material.density, restitution: material.restitution, friction: material.friction };
};

cc.PHYSICSSHAPE_MATERIAL_DEFAULT = cc.PhysicsMaterial ( 0.0, 0.5, 0.5 );

cc.PhysicsShape = cc.Class.extend
({	
	ctor:function ( )
	{
		this._body					= null;
		this._info					= null;
		this._type					= cc.PhysicsShape.Type.UNKNOWN;
		this._area					= 0;
		this._mass					= 0;
		this._moment				= 0;
		this._scaleX				= 1.0;
		this._scaleY				= 1.0;
		this._newScaleX				= 1.0;
		this._newScaleY				= 1.0;
		this._dirty					= false;
		this._material				= cc.PhysicsMaterial.clone ( cc.PHYSICSSHAPE_MATERIAL_DEFAULT );
		this._tag					= 0;
		this._categoryBitmask		= cc.UINT_MAX;
		this._collisionBitmask		= cc.UINT_MAX;
		this._contactTestBitmask	= 0;
		this._group					= 0;		
	},
	
	/** Get the body that this shape attaches */
	getBody:function ( )
	{
		return this._body; 
	},
	
	/** Return the type of this shape */
	getType:function ( ) 
	{
		return this._type; 
	},
	
	/** return the area of this shape */
	getArea:function ( ) 
	{
		return this._area; 
	},
	
	/** get moment */
	getMoment:function ( )
	{
		return this._moment; 
	},
	
	/** Set moment, it will change the body's moment this shape attaches */
	setMoment:function ( moment )
	{
		if ( moment < 0 )
		{
			return;
		}

		if ( this._body )
		{
			this._body.addMoment ( -this._moment );
			this._body.addMoment ( moment );
		};

		this._moment = moment;		
	},
	
	setTag:function ( tag )
	{
		this._tag = tag; 
	},
	
	getTag:function ( ) 
	{
		return this._tag; 
	},

	/** get mass */
	getMass:function ( )
	{
		return this._mass; 
	},
	
	/** Set mass, it will change the body's mass this shape attaches */
	setMass:function ( mass )
	{
		if ( mass < 0 )
		{
			return;
		}

		if ( this._body )
		{
			this._body.addMass ( -this._mass );
			this._body.addMass ( mass );
		};

		this._mass = mass;		
	},
	
	getDensity:function ( ) 
	{
		return this._material.density; 
	},
	
	setDensity:function ( density )
	{
		if ( density < 0 )
		{
			return;
		}

		this._material.density = density;

		if ( this._material.density == cc.PHYSICS_INFINITY )
		{
			this.setMass ( cc.PHYSICS_INFINITY );
		}
		else if ( this._area > 0 )
		{
			this.setMass ( this._material.density * this._area );
		}		
	},
	
	getRestitution:function ( )
	{
		return this._material.restitution; 
	},

	setRestitution:function ( restitution )
	{
		this._material.restitution = restitution;

		var		shapes = this._info.getShapes ( );
		for ( var idx in shapes )
		{
			var		shape = shapes [ idx ];
			shape.setElasticity ( restitution );			
		}	
	},
	
	getFriction:function ( ) 
	{
		return this._material.friction; 
	},
	
	setFriction:function ( friction )
	{
		this._material.friction = friction;

		var		shapes = this._info.getShapes ( );
		for ( var idx in shapes )
		{
			var		shape = shapes [ idx ];
			shape.setFriction ( friction );			
		}		
	},
	
	getMaterial:function ( )
	{
		return this._material; 
	},
	
	setMaterial:function ( material )
	{
		this.setDensity ( material.density );
		this.setRestitution ( material.restitution );
		this.setFriction ( material.friction );		
	},

	/** Calculate the default moment value */
	calculateDefaultMoment:function ( ) 
	{
		return 0.0;
	},
	
	/** Get offset */
	getOffset:function ( ) 
	{
		return cp.vzero; 
	},
		
	getCenter:function ( )
	{
		return this.getOffset(); 
	},
	
	/** Test point is in shape or not */
	containsPoint:function ( point )
	{
		var		shapes = this._info.getShapes ( );
		for ( var idx in shapes )
		{
			var		shape = shapes [ idx ];
			if ( shape.pointQuery ( point ) )
			{				
				return true;
			}			
		}

		return false;		
	},

	/**
	 * A mask that defines which categories this physics body belongs to.
	 * Every physics body in a scene can be assigned to up to 32 different categories, each corresponding to a bit in the bit mask. You define the mask values used in your game. In conjunction with the collisionBitMask and contactTestBitMask properties, you define which physics bodies interact with each other and when your game is notified of these interactions.
	 * The default value is 0xFFFFFFFF (all bits set).
	 */
	setCategoryBitmask:function ( bitmask )
	{
		this._categoryBitmask = bitmask; 
	},
	
	getCategoryBitmask:function ( ) 
	{
		return this._categoryBitmask; 
	},
	
	/**
	 * A mask that defines which categories of bodies cause intersection notifications with this physics body.
	 * When two bodies share the same space, each body's category mask is tested against the other body's contact mask by performing a logical AND operation. If either comparison results in a non-zero value, an PhysicsContact object is created and passed to the physics world's delegate. For best performance, only set bits in the contacts mask for interactions you are interested in.
	 * The default value is 0x00000000 (all bits cleared).
	 */
	setContactTestBitmask:function ( bitmask )
	{
		this._contactTestBitmask = bitmask; 
	},
	
	getContactTestBitmask:function ( ) 
	{
		return this._contactTestBitmask; 
	},
	
	/**
	 * A mask that defines which categories of physics bodies can collide with this physics body.
	 * When two physics bodies contact each other, a collision may occur. This body's collision mask is compared to the other body's category mask by performing a logical AND operation. If the result is a non-zero value, then this body is affected by the collision. Each body independently chooses whether it wants to be affected by the other body. For example, you might use this to avoid collision calculations that would make negligible changes to a body's velocity.
	 * The default value is 0xFFFFFFFF (all bits set).
	 */
	setCollisionBitmask:function ( bitmask )
	{
		this._collisionBitmask = bitmask; 
	},
	
	getCollisionBitmask:function ( ) 
	{
		return this._collisionBitmask; 
	},

	/**
	 * set the group of body
	 * Collision groups let you specify an integral group index. You can have all fixtures with the same group index always collide (positive index) or never collide (negative index)
	 * it have high priority than bit masks
	 */
	setGroup:function ( group )
	{		
		if ( group < 0 )
		{
			var		shapes = this._info.getShapes ( );
			for ( var idx in shapes )
			{
				var		shape = shapes [ idx ];
				shape.group = group;
			}
		}

		this._group = group;		
	},

	getGroup:function ( ) 
	{
		return this._group; 
	},

	init:function ( type )
	{
		this._info = new cc.PhysicsShapeInfo ( this );
		this._type = type;

		return true;
	},

	/**
	 * @brief PhysicsShape is PhysicsBody's friend class, but all the subclasses isn't. so this method is use for subclasses to catch the bodyInfo from PhysicsBody.
	 */
	bodyInfo:function ( ) 
	{
		if ( this._body != null )
		{
			return this._body._info;
		}
		else
		{
			return null;
		}		
	},

	setBody:function ( body )
	{
		// already added
		if ( body != null && this._body == body )
		{
			return;
		}

		if ( this._body != null )
		{
			this._body.removeShape ( this );
		}

		if ( body == null )
		{
			this._info.setBody ( null );
			this._body = null;
		}
		else
		{
			this._info.setBody ( body._info.getBody ( ) );
			this._body = body;
		}		
	},

	/** calculate the area of this shape */
	calculateArea:function ( )
	{
		return 0.0; 
	},
	
	setScale:function ( scale, scaleY )
	{		
		if ( scaleY === undefined )
		{
			this.setScaleX ( scale );
			this.setScaleY ( scale );
		}
		else 
		{
			this.setScaleX ( scale  );
			this.setScaleY ( scaleY );
		}	 
	},
	
	setScaleX:function ( scaleX )
	{
		if ( this._scaleX == scaleX )
		{
			return;
		}

		this._newScaleX = scaleX;
		this._dirty = true;				
	},
	
	setScaleY:function ( scaleY )
	{
		if ( this._scaleY == scaleY )
		{
			return;
		}

		this._newScaleY = scaleY;
		this._dirty = true;	
	},

	update:function ( delta )
	{
		if ( this._dirty )
		{
			this._scaleX = this._newScaleX;
			this._scaleY = this._newScaleY;
			this._dirty = false;
		}
	},
});

cc.PhysicsShape.Type =
{
	UNKNOWN		: 0,
	CIRCLE		: 1,
	BOX			: 2,
	POLYGEN		: 3,
	EDGESEGMENT	: 4,
	EDGEBOX		: 5,
	EDGEPOLYGEN	: 6,
	EDGECHAIN	: 7			
};

/** move the points to the center */
cc.PhysicsShape.recenterPoints = function ( points, count, center )
{
	if ( center === undefined )
	{
		center = cp.vzero;
	}

	cp.recenterPoly ( points );

	if ( center != cp.vzero )
	{
		for ( var i = 0; i < count; ++i )
		{
			points [ i ] += center;
		}
	}
};

/** get center of the polyon points */
cc.PhysicsShape.getPolyonCenter = function ( points )
{
	var		verts = null;
	if ( (typeof points [ 0 ]) == "object" )
	{
		verts = new Array ( points.length * 2 );
		for ( var i = 0; i < points.length; i++ )
		{
			verts [ i * 2 + 0 ] = points [ i ].x;
			verts [ i * 2 + 1 ] = points [ i ].y;
		}		
	}
	else
	{
		verts = points;
	}
	
	var 	center = cp.centroidForPoly ( verts );    
	return center;
};

/** A circle shape */
cc.PhysicsShapeCircle = cc.PhysicsShape.extend
({
	ctor:function ( )
	{
		this._super ( );		
	},
	
	init:function ( radius, material, offset )
	{
		if ( material === undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSSHAPE_MATERIAL_DEFAULT );
		if ( offset   === undefined )	offset   = cp.vzero;

		cc.PhysicsShape.prototype.init.call ( this, cc.PhysicsShape.Type.CIRCLE );

		var 	shape = new cp.CircleShape ( this._info.getSharedBody ( ), radius, offset );
		if ( shape == null )
		{
			return false;
		}
		this._info.add ( shape );

		this._area = this.calculateArea ( );
		this._mass = material.density == cc.PHYSICS_INFINITY ? cc.PHYSICS_INFINITY : material.density * this._area;
		this._moment = this.calculateDefaultMoment ( );

		this.setMaterial ( material );

		return true;
	},
		
    calculateDefaultMoment:function ( )
    {
    	var 	shape = this._info.getShapes ( ) [ 0 ];
    	return this._mass == cc.PHYSICS_INFINITY ? cc.PHYSICS_INFINITY : cp.momentForCircle ( this._mass, 0, shape.r, shape.c );
    },

    getRadius:function ( )
    {
    	var 	shape = this._info.getShapes ( ) [ 0 ];
    	return shape.r;
    },
    
    getOffset:function ( )
    {
    	var 	shape = this._info.getShapes ( ) [ 0 ];
    	return shape.c;
    },

    calculateArea:function ( )
    {
    	var 	shape = this._info.getShapes ( ) [ 0 ];    	
    	return cp.areaForCircle ( 0, shape.r );
    },
    
    setScale:function ( scale, scaleY )
    {		
    	if ( scaleY === undefined )
    	{
    		if ( this._scaleX == scale )
    		{
    			return;
    		}
    		
    		this._newScaleX = this._newScaleY = scale;
    		this._dirty = true;
    	}
    	else 
    	{
    		if ( scale != scaleY )
    		{
    			cc.log ( "PhysicsShapeCircle WARNING: CANNOT support setScale with different x and y" );
    		}
    		
    		if ( this._scaleX == scale )
    		{
    			return;
    		}    		
    		
    		this._newScaleX = this._newScaleY = scale;
    		this._dirty = true;
    	}	 
    },

    setScaleX:function ( scale )
    {
    	cc.log ( "PhysicsShapeCircle WARNING: CANNOT support setScaleX" );

    	this.setScale ( scale );
    },

    setScaleY:function ( scale )
    {
    	cc.log ( "PhysicsShapeCircle WARNING: CANNOT support setScaleY" );

    	this.setScale ( scale );	
    },

    update:function ( delta )
    {
    	if ( this._dirty )
    	{
    		var 	factor = Math.abs ( this._newScaleX / this._scaleX );
    		var 	shape = this._info.getShapes ( ) [ 0 ];
    		var 	v = shape.c;
    		v = cp.v.mult ( v, factor );
    		shape.c = v;
    		shape.r = shape.r * factor;
    	}

    	cc.PhysicsShape.prototype.update.call ( this, delta );
    },    
});

cc.PhysicsShapeCircle.calculateArea = function ( radius )
{
	return cp.areaForCircle ( 0, radius );
};

cc.PhysicsShapeCircle.calculateMoment = function ( mass, radius, offset )
{
	if ( offset === undefined )		offset = cp.vzero;
	
	return mass == cc.PHYSICS_INFINITY ? cc.PHYSICS_INFINITY : cp.momentForCircle ( mass, 0, radius, offset );
};

cc.PhysicsShapeCircle.create = function ( radius, material, offset )
{	
	var		Shape = new cc.PhysicsShapeCircle ( );
	Shape.init ( radius, material, offset );
	return Shape;
};

/** A polygon shape */
cc.PhysicsShapePolygon = cc.PhysicsShape.extend
({
	ctor:function ( )
	{
		this._super ( );		
	},
	
	init:function ( points, material, offset )
	{		
		if ( material === undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSSHAPE_MATERIAL_DEFAULT );
		if ( offset   === undefined )	offset   = cp.vzero;

		cc.PhysicsShape.prototype.init.call ( this, cc.PhysicsShape.Type.POLYGEN );

		var		verts = null;
		if ( (typeof points [ 0 ]) == "object" )
		{
			verts = new Array ( points.length * 2 );
			for ( var i = 0; i < points.length; i++ )
			{
				verts [ i * 2 + 0 ] = points [ i ].x;
				verts [ i * 2 + 1 ] = points [ i ].y;
			}		
		}
		else
		{
			verts = points;
		}
		
		var 	shape = new cp.PolyShape ( this._info.getSharedBody ( ), verts, offset );
		if ( shape == null )
		{
			return false;
		}
		this._info.add ( shape );
			
		this._area = this.calculateArea ( );
		this._mass = material.density == cc.PHYSICS_INFINITY ? cc.PHYSICS_INFINITY : material.density * this._area;
		this._moment = this.calculateDefaultMoment ( );

		this.setMaterial ( material );
		
		return true;
	},
	
	calculateDefaultMoment:function ( )
	{
		var		shape = this._info.getShapes ( ) [ 0 ];		
		return this._mass == cc.PHYSICS_INFINITY ? cc.PHYSICS_INFINITY : cp.momentForPoly ( this._mass, shape.verts, cp.vzero );
	},

	getPoint:function ( i ) 
	{
		var		shape = this._info.getShapes ( ) [ 0 ];		
		return cp.v ( shape.verts [ i * 2 ], shape.verts [ i * 2 + 1 ] );
	},
	
	getPoints:function ( outPoints ) 
	{
		var		shape = this._info.getShapes ( ) [ 0 ];			
		for ( var i = 0; i < shape.verts.length / 2; i++ )
		{
			outPoints [ i ] = cp.v ( shape.verts [ i * 2 ], shape.verts [ i * 2 + 1 ] );
		}
	},
	
	getPointsCount:function ( ) 
	{
		var		shape = this._info.getShapes ( ) [ 0 ];	
		return shape.verts.length / 2;
	},

	getCenter:function ( ) 
	{
		var		shape = this._info.getShapes ( ) [ 0 ];			
		return cp.centroidForPoly ( shape.verts );
	},
	
	calculateArea:function ( ) 
	{
		var		shape = this._info.getShapes ( ) [ 0 ];
		return cp.areaForPoly ( shape.verts );			
	},
	
	update:function ( delta ) 
	{
		if ( this._dirty )
		{
			var 	factorX = this._newScaleX / this._scaleX;
			var 	factorY = this._newScaleY / this._scaleY;
			
			var		shape  = this._info.getShapes ( ) [ 0 ];
			var		count  = shape.verts.length / 2;
						
			var		verts  = shape.verts;
			var		planes = shape.planes;
			
			for ( var i = 0; i < count; i++ ) 
			{
				verts [ i * 2 + 0 ] *= factorX;
				verts [ i * 2 + 1 ] *= factorY;	
			}
			
			// convert hole to clockwise
			if ( factorX * factorY < 0 )
			{
				for ( var i = 0; i < count / 2; i++ )
				{
					var		vx = verts [ i * 2 + 0 ];
					var		vy = verts [ i * 2 + 1 ];
					
					verts [ i * 2 + 0 ] = verts [ ( count - i - 1 ) * 2 + 0 ];
					verts [ i * 2 + 1 ] = verts [ ( count - i - 1 ) * 2 + 1 ];
					
					verts [ ( count - i - 1 ) * 2 + 0 ] = vx;
					verts [ ( count - i - 1 ) * 2 + 1 ] = vy;
				}
			}

			for ( var i = 0; i < count; i++ )
			{
				var 	v0 = cp.v ( verts [ i * 2 + 0 ], verts [ i * 2 + 1 ] );
				var		v1 = cp.v ( verts [ ( ( i + 1 ) % count ) * 2 + 0 ], verts [ ( ( i + 1 ) % count ) * 2 + 1 ] );
				
				var		n  = cp.v.normalize ( cp.v.perp ( cp.v.sub ( v0, v1 ) ) );

				planes [ i ].n = n;
				planes [ i ].d = cp.v.dot ( n, v0 );			
			}
			
			// !Bug - Native doesn't change value : verts, planes
		}
		
		cc.PhysicsShape.prototype.update.call ( this, delta );			
	},
});

cc.PhysicsShapePolygon.create = function ( points, material, offset )
{	
	var		Shape = new cc.PhysicsShapePolygon ( );
	Shape.init ( points, material, offset );
	return Shape;
};

/** A box shape */
cc.PhysicsShapeBox = cc.PhysicsShapePolygon.extend
({
	ctor:function ( )
	{
		this._super ( );		
	},
	
	getSize:function ( )
	{
		var		shape = this._info.getShapes ( ) [ 0 ];
		var		v0 = cp.v ( shape.verts [ 0 ], shape.verts [ 1 ] );
		var		v1 = cp.v ( shape.verts [ 2 ], shape.verts [ 3 ] );
		var		v2 = cp.v ( shape.verts [ 4 ], shape.verts [ 5 ] );

		return cc.size ( cp.v.dist ( v1, v2 ), cp.v.dist ( v0, v1 ) );
	},

	getOffset:function ( )
	{
		return this.getCenter ( ); 
	},	

	init:function ( size, material, offset )
	{		
		if ( material === undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSSHAPE_MATERIAL_DEFAULT );
		if ( offset   === undefined )	offset	 = cp.vzero;

		cc.PhysicsShape.prototype.init.call ( this, cc.PhysicsShape.Type.BOX );

		var 	points = 
		[
			 -size.width / 2, -size.height / 2,
			 -size.width / 2, +size.height / 2,
			 +size.width / 2, +size.height / 2,
			 +size.width / 2, -size.height / 2
		];

		var 	shape = new cp.PolyShape ( this._info.getSharedBody ( ), points, offset );

		if ( shape == null )
		{
			return false;
		}
		this._info.add ( shape );

		this._area = this.calculateArea ( );
		this._mass = material.density == cc.PHYSICS_INFINITY ? cc.PHYSICS_INFINITY : material.density * this._area;
		this._moment = this.calculateDefaultMoment ( );

		this.setMaterial ( material );
		
		return true;
	}
});

cc.PhysicsShapeBox.create = function ( size, material, offset )
{	
	var		Shape = new cc.PhysicsShapeBox ( );
	Shape.init ( size, material, offset );
	return Shape;
};

/** A segment shape */
cc.PhysicsShapeEdgeSegment = cc.PhysicsShape.extend
({
	ctor:function ( )
	{
		this._super ( );		
	},

	init:function ( a, b, material, border )
	{
		if ( material === undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSSHAPE_MATERIAL_DEFAULT );
		if ( border   === undefined )	border	 = 1;

		cc.PhysicsShape.prototype.init.call ( this, cc.PhysicsShape.Type.EDGESEGMENT );

		var 	shape = new cp.SegmentShape ( this._info.getSharedBody ( ), a, b, border );
		if ( shape == null )
		{
			return false;				
		}		
		this._info.add ( shape );
	                
		this._mass = cc.PHYSICS_INFINITY;
		this._moment = cc.PHYSICS_INFINITY;
    
		this.setMaterial ( material );		
	},
	
    getPointA:function ( )
    {
    	return this._info.getShapes ( ) [ 0 ].ta;
    },
    
    getPointB:function ( )
    {
    	return this._info.getShapes ( ) [ 0 ].tb;
    },
    		
    getCenter:function ( ) 
    {
    	var 	a = this._info.getShapes ( ) [ 0 ].a;
    	var 	b = this._info.getShapes ( ) [ 0 ].b;

    	return cp.v.mult ( cp.v.add ( a, b ), 0.5 );
    },

    update:function ( delta )
    {
    	if ( this._dirty )
    	{
    		var 	factorX = this._newScaleX / this._scaleX;
    		var 	factorY = this._newScaleY / this._scaleY;

    		var		shape = this._info.getShapes ( ) [ 0 ];    	
			var 	a = cp.v ( shape.a.x, shape.a.y );											
			a.x *= factorX;
			a.y *= factorY;

			var 	b = cp.v ( shape.b.x, shape.b.y );	
			b.x *= factorX;
			b.y *= factorY;		

			shape.setEndpoints ( a, b );								    		
    	}

    	cc.PhysicsShape.prototype.update.call ( this, delta );
    },
});

cc.PhysicsShapeEdgeSegment.create = function ( a, b, material, border )
{	
	var		Shape = new cc.PhysicsShapeEdgeSegment ( );
	Shape.init ( a, b, material, border );
	return Shape;
};

/** An edge polygon shape */
cc.PhysicsShapeEdgePolygon = cc.PhysicsShape.extend
({
	ctor:function ( )
	{
		this._super ( );		
	},

	init:function ( points, material, border )
	{		
		if ( material === undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSSHAPE_MATERIAL_DEFAULT );
		if ( border   === undefined )	border   = 1;

		cc.PhysicsShape.prototype.init.call ( this, cc.PhysicsShape.Type.EDGEPOLYGEN );		

		var		verts = null;
		if ( (typeof points [ 0 ]) == "object" )
		{
			verts = points;
		}
		else
		{
			verts = new Array ( );
			for ( var i = 0; i < points.length; i += 2 )
			{
				verts.push ( cp.v ( points [ i ], points [ i + 1 ] ) );	
			}	
		}
		
		var		count = verts.length;
		for ( var i = 0; i < count; ++i )
		{
			var 	shape = new cp.SegmentShape ( this._info.getSharedBody ( ), verts [ i ], verts [ ( i + 1 ) % count ], border );
			if ( shape == null )
			{
				return false;				
			}

			shape.setElasticity ( 1 );
			shape.setFriction ( 1 );
						
			this._info.add ( shape );
		}
		                
		this._mass = cc.PHYSICS_INFINITY;
		this._moment = cc.PHYSICS_INFINITY;
        
        this.setMaterial ( material );

		return true;
	},

	getCenter:function ( )
	{
		var		shapes = this._info.getShapes ( );
		var		points = new Array ( shapes.length );
		
		for ( var idx in shapes ) 
		{
			points [ idx ] = shapes [ idx ].a;
		}

		var 	center = cp.CentroidForPoly ( points );
		return center;
	},
	
	getPoints:function ( outPoints )
	{
		var		shapes = this._info.getShapes ( );
		
		for ( var idx in shapes ) 
		{
			outPoints [ idx ] = shapes [ idx ].a;
		}		
	},
	
	getPointsCount:function ( )
	{
		return this._info.length;
	},	

	update:function ( delta )
	{
		if ( this._dirty )
		{
			var 	factorX = this._newScaleX / this._scaleX;
			var 	factorY = this._newScaleY / this._scaleY;
			
			var		shapes = this._info.getShapes ( );
			for ( var idx in shapes ) 
			{
				var		shape = shapes [ idx ];
									
				var 	a = cp.v ( shape.a.x, shape.a.y );											
				a.x *= factorX;
				a.y *= factorY;
				
				var 	b = cp.v ( shape.b.x, shape.b.y );	
				b.x *= factorX;
				b.y *= factorY;		

				shape.setEndpoints ( a, b );					
			}
		}

		cc.PhysicsShape.prototype.update.call ( this, delta );		
	},	
});

cc.PhysicsShapeEdgePolygon.create = function ( points, material, border )
{	
	var		Shape = new cc.PhysicsShapeEdgePolygon ( );
	Shape.init ( points, material, border );
	return Shape;
};

/** An edge box shape */
cc.PhysicsShapeEdgeBox = cc.PhysicsShapeEdgePolygon.extend
({
	ctor:function ( )
	{
		this._super ( );		
	},

	init:function ( size, material, border, offset )
	{				
		if ( material === undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSSHAPE_MATERIAL_DEFAULT );
		if ( border   === undefined )	border   = 1;
		if ( offset   === undefined )	offset   = cp.vzero;
		
		cc.PhysicsShape.prototype.init.call ( this, cc.PhysicsShape.Type.EDGEBOX );	
		
		var 	points = 
		[
		 	cp.v ( -size.width / 2 + offset.x, -size.height / 2 + offset.y ),
		 	cp.v ( +size.width / 2 + offset.x, -size.height / 2 + offset.y ),
		 	cp.v ( +size.width / 2 + offset.x, +size.height / 2 + offset.y ),
		 	cp.v ( -size.width / 2 + offset.x, +size.height / 2 + offset.y )
		 	];

		for ( var i = 0; i < 4; ++i )
		{
			var 	shape = new cp.SegmentShape ( this._info.getSharedBody ( ), points [ i ], points [ ( i + 1 ) % 4 ], border );
			
			if ( shape == null )
			{
				return false;
			}
			this._info.add ( shape );
		}		

		this._mass = cc.PHYSICS_INFINITY;
		this._moment = cc.PHYSICS_INFINITY;
		
		this.setMaterial ( material );
		
		return true;
	},
	
	getOffset:function ( )
	{
		return this.getCenter ( );
	},
});

cc.PhysicsShapeEdgeBox.create = function ( size, material, border, offset )
{	
	var		Shape = new cc.PhysicsShapeEdgeBox ( );
	Shape.init ( size, material, border, offset );
	return Shape;
};

/** a chain shape */
cc.PhysicsShapeEdgeChain = cc.PhysicsShapeEdgePolygon.extend
({
	ctor:function ( )
	{
		this._super ( );		
	},

	init:function ( points, material, border )
	{				
		if ( material === undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSSHAPE_MATERIAL_DEFAULT );
		if ( border   === undefined )	border   = 1;

		cc.PhysicsShape.prototype.init.call ( this, cc.PhysicsShape.Type.EDGECHAIN );	

		var		verts = null;
		if ( (typeof points [ 0 ]) == "object" )
		{
			verts = points;
		}
		else
		{
			verts = new Array ( );
			for ( var i = 0; i < points.length; i += 2 )
			{
				verts.push ( cp.v ( points [ i ], points [ i + 1 ] ) );	
			}	
		}

		var		count = verts.length;
		for ( var i = 0; i < count - 1; ++i )
		{
			var 	shape = new cp.SegmentShape ( this._info.getSharedBody ( ), verts [ i ], verts [ i + 1 ], border );
			if ( shape == null )
			{
				return false;				
			}

			shape.setElasticity ( 1 );
			shape.setFriction ( 1 );

			this._info.add ( shape );
		}	

		this._mass = cc.PHYSICS_INFINITY;
		this._moment = cc.PHYSICS_INFINITY;

		this.setMaterial ( material );

		return true;
	},

	getCenter:function ( )
	{
		var		shapes = this._info.getShapes ( );
		var 	count  = shapes.length + 1;
		var		points = new Array ( count );
		
		for ( var idx in shapes )
		{
			var		shape = shapes [ idx ];
			points [ i++ ] = cp.v ( shape.a.x, shape.a.y );	
		}

		points [ i++ ] = shapes [ shapes.length - 1 ].b;

		var 	center = cp.centroidForPoly ( points );
		return center;
	},
	
	getPoints:function ( outPoints )
	{
		var		shapes = this._info.getShapes ( );
		for ( var idx in shapes )
		{
			var		shape = shapes [ idx ];
			outPoints [ i++ ] = cp.v ( shape.a.x, shape.a.y );	
		}

		outPoints [ i++ ] = shapes [ shapes.length - 1 ].b;
	},
	
	getPointsCount:function ( )
	{
		return this._info.getShapes ( ).length + 1;
	},
	
	update:function ( )
	{
		if ( this._dirty )
		{
			var 	factorX = this._newScaleX / this._scaleX;
			var 	factorY = this._newScaleY / this._scaleY;

			var		shapes = this._info.getShapes ( );
			for ( var idx in shapes ) 
			{
				var		shape = shapes [ idx ];

				var 	a = cp.v ( shape.a.x, shape.a.y );											
				a.x *= factorX;
				a.y *= factorY;

				var 	b = cp.v ( shape.b.x, shape.b.y );		
				b.x *= factorX;
				b.y *= factorY;		

				shape.setEndpoints ( a, b );								
			}
		}

		cc.PhysicsShape.prototype.update.call ( this, delta );		
	},
});

cc.PhysicsShapeEdgeChain.create = function ( points, material, border )
{	
	var		Shape = new cc.PhysicsShapeEdgeBox ( );
	Shape.init ( points, material, border );
	return Shape;
};

