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

cc.PHYSICSBODY_MATERIAL_DEFAULT = cc.PhysicsMaterial ( 0.1, 0.5, 0.5 );

cc.MASS_DEFAULT 	= 1.0;
cc.MOMENT_DEFAULT 	= 200;

/**
 * A body affect by physics.
 * it can attach one or more shapes.
 * if you create body with createXXX, it will automatically compute mass and moment with density your specified(which is PHYSICSBODY_MATERIAL_DEFAULT by default, and the density value is 0.1f), and it based on the formular: mass = density * area.
 * if you create body with createEdgeXXX, the mass and moment will be PHYSICS_INFINITY by default. and it's a static body.
 * you can change mass and moment with setMass() and setMoment(). and you can change the body to be dynamic or static by use function setDynamic().
 */
cc.PhysicsBody = cc.Class.extend
({
	ctor:function ( mass, moment ) 
	{
		this._node				= null;
		this._joints			= new Array ( );
		this._shapes			= new Array ( );
		this._world				= null;
		this._info				= null;
		this._dynamic			= true;
		this._enabled			= true;
		this._rotationEnabled 	= true;
		this._gravityEnabled	= true;
		this._area				= 0.0;
		this._density			= 0.0;
		this._isDamping			= false;
		this._linearDamping		= 0.0;
		this._angularDamping	= 0.0;
		this._tag				= 0;
		this._positionResetTag	= false;
		this._rotationResetTag	= false;
		this._positionOffset	= cp.vzero;
		this._rotationOffset	= 0;	
		
		if ( mass === undefined )
		{
			this._massDefault 	= true;
			this._mass			= cc.MASS_DEFAULT;			
		}
		else
		{
			this._massDefault 	= false;
			this._mass			= mass;					
		}
		
		if ( moment === undefined )
		{
			this._momentDefault = true;
			this._moment		= cc.MOMENT_DEFAULT;			
		}
		else
		{
			this._momentDefault = false;
			this._moment		= moment;					
		}
		
		this.init ( );
	},
	
	init:function ( )
	{
		this._info = new cc.PhysicsBodyInfo ( );	
		this._info.setBody ( new cp.Body ( this._mass, this._moment ) );
		
		return true;		
	},
	
	/*
	 * @brief add a shape to body
	 * @param shape the shape to be added
	 * @param addMassAndMoment if this is true, the shape's mass and moment will be added to body. the default is true
	 */	
	addShape:function ( shape, addMassAndMoment )
	{		
		if ( addMassAndMoment === undefined )	addMassAndMoment = true;
		
		if ( shape == null )	
		{
			return null;
		}					
	
		// add shape to body		
		if ( this._shapes.indexOf ( shape ) == -1 )
		{
			shape.setBody ( this );

			// calculate the area, mass, and desity
			// area must update before mass, because the density changes depend on it.
			if ( addMassAndMoment )
			{
				this._area += shape.getArea ( );
				this.addMass ( shape.getMass ( ) );
				this.addMoment ( shape.getMoment ( ) );
			}

			if ( this._world != null )
			{
				this._world.addShape ( shape );
			}

			this._shapes.push ( shape );
		}
		
		return shape;
	},
	
	/*
	 * @brief remove a shape from body
	 * @param shape the shape to be removed
	 * @param reduceMassAndMoment if this is true, the body mass and moment will be reduced by shape. the default is true
	 */
	removeShape:function ( val, reduceMassAndMoment )
	{
		if ( reduceMassAndMoment === undefined )	reduceMassAndMoment = true;
		
		if ( val instanceof cc.PhysicsShape )
		{
			var		shape = val;
			
			var		idx = this._shapes.indexOf ( shape );
			if ( idx != -1 )
			{
				// deduce the area, mass and moment
				// area must update before mass, because the density changes depend on it.
				if ( reduceMassAndMoment )
				{
					this._area -= shape.getArea ( );
					this.addMass ( -shape.getMass ( ) );
					this.addMoment ( -shape.getMoment ( ) );
				}

				// remove
				if ( this._world )
				{
					this._world.removeShape ( shape );
				}

				// set shape->_body = nullptr make the shape->setBody will not trigger the _body->removeShape function call.
				shape._body = null;
				shape.setBody ( null );			
				this._shapes.splice ( idx, 1 );	
			}				
		}
		else
		{
			var		tag = val;
			
			for ( var idx in this._shapes )
			{
				var		shape = this._shapes [ idx ];
				if ( shape.getTag ( ) == tag )
				{
					this.removeShape ( shape, reduceMassAndMoment );
					return;
				}
			}					
		}		
	},
	
	/* remove all shapes */
	removeAllShapes:function ( reduceMassAndMoment )
	{
		if ( reduceMassAndMoment === undefined )	reduceMassAndMoment = true;
		
		for ( var idx in this._shapes )
		{
			var 	shape = this._shapes [ idx ];

			// deduce the area, mass and moment
			// area must update before mass, because the density changes depend on it.
			if ( reduceMassAndMoment )
			{
				this._area -= shape.getArea ( );
				this.addMass ( -shape.getMass ( ) );
				this.addMoment ( -shape.getMoment ( ) );
			}

			if ( this._world )
			{
				this._world.removeShape ( shape );
			}

			// set shape->_body = nullptr make the shape->setBody will not trigger the _body->removeShape function call.
			shape._body = null;
			shape.setBody ( null );
		}

		this._shapes.splice ( 0, this._shapes.length );				
	},
	
	/* get the body shapes. */
	getShapes:function ( ) 
	{
		return this._shapes;
	},
	
	/* get the first shape of the body shapes. */
	getFirstShape:function ( ) 
	{
		return this._shapes.length >= 1 ? this._shapes [ 0 ] : null; 
	},
	
	/* get the shape of the body. */
	getShape:function ( tag )
	{
		for ( var idx in this._shapes )
		{
			var		shape = this._shapes [ idx ];
			if ( shape.getTag ( ) == tag )
			{
				return shape;
			}
		}

		return null;
	},

	/** Applies a immediate force to body. */
	applyForce:function ( force, offset )
	{		
		if ( offset === undefined )	offset = cp.vzero;

		if ( this._dynamic && this._mass != cc.PHYSICS_INFINITY )
		{
			this._info.getBody ( ).applyForce ( force, offset );
		}
	},
	
	/** reset all the force applied to body. */
	resetForces:function ( )
	{
		this._info.getBody ( ).resetForces ( );
		
		// if _gravityEnabled is false, add a reverse of gravity force to body
		if ( this._world != null && this._dynamic && !this._gravityEnabled && this._mass != cc.PHYSICS_INFINITY )
		{
			this.applyForce ( cp.v.mult ( cp.v.neg ( this._world.getGravity ( ) ), this._mass ) );
		}		
	},
	
	/** Applies a continuous force to body. */
	applyImpulse:function ( impulse, offset )
	{
		if ( offset === undefined )	offset = cp.vzero;
		
		this._info.getBody ( ).applyImpulse ( impulse, offset );
	},
	
	/** Applies a torque force to body. */
	applyTorque:function ( torque )
	{
		this._info.getBody ( ).t = torque;		
	},

	/** set the velocity of a body */
	setVelocity:function ( velocity )
	{
		if ( !this._dynamic )
		{
			cc.log ( "physics warning: your can't set velocity for a static body." );
			return;
		}

		this._info.getBody ( ).setVel ( velocity );
	},
	
	/** get the velocity of a body */
	getVelocity:function ( )
	{
		return this._info.getBody ( ).getVel ( );
	},
	
	/** set the angular velocity of a body */
	setAngularVelocity:function ( velocity )
	{
		if ( !this._dynamic )
		{
			cc.log ( "physics warning: your can't set angular velocity for a static body." );
			return;
		}
		
		this._info.getBody ( ).setAngVel ( velocity );
	},
	
	/** get the angular velocity of a body at a local point */
	getVelocityAtLocalPoint:function ( point )
	{
		return this._info.getBody ( ).getVelAtLocalPoint ( point );	
	},
	
	/** get the angular velocity of a body at a world point */
	getVelocityAtWorldPoint:function ( point )
	{
		return this._info.getBody ( ).getVelAtWorldPoint ( point );
	},
	
	/** get the angular velocity of a body */
	getAngularVelocity:function ( )
	{
		return this._info.getBody ( ).getAngVel ( );
	},
	
	/** set the max of velocity */
	setVelocityLimit:function ( limit )
	{
		this._info.getBody ( ).v_limit = limit;
	},
	
	/** get the max of velocity */
	getVelocityLimit:function ( )
	{
		return this._info.getBody ( ).v_limit; 
	},
	
	/** set the max of angular velocity */
	setAngularVelocityLimit:function ( limit )
	{
		this._info.getBody ( ).w_limit = limit;
	},
	
	/** get the max of angular velocity */
	getAngularVelocityLimit:function ( )
	{
		return this._info.getBody ( ).w_limit; 
	},

	/** remove the body from the world it added to */
	removeFromWorld:function ( )
	{
		if ( this._world )
		{
			this._world.removeBody ( this );
		}
	},

	/** get the world body added to. */
	getWorld:function ( ) 
	{
		return this._world; 
	},
	
	/** get all joints the body have */
	getJoints:function ( ) 
	{
		return this._joints; 
	},

	/** get the sprite the body set to. */
	getNode:function ( ) 
	{
		return this._node; 
	},

	/**
	 * A mask that defines which categories this physics body belongs to.
	 * Every physics body in a scene can be assigned to up to 32 different categories, each corresponding to a bit in the bit mask. You define the mask values used in your game. In conjunction with the collisionBitMask and contactTestBitMask properties, you define which physics bodies interact with each other and when your game is notified of these interactions.
	 * The default value is 0xFFFFFFFF (all bits set).
	 */
	setCategoryBitmask:function ( bitmask )
	{
		for ( var idx in this._shapes )
		{
			this._shapes [ idx ].setCategoryBitmask ( bitmask );	
		}		
	},
	
	/** 
	 * A mask that defines which categories of bodies cause intersection notifications with this physics body.
	 * When two bodies share the same space, each body’s category mask is tested against the other body’s contact mask by performing a logical AND operation. If either comparison results in a non-zero value, an PhysicsContact object is created and passed to the physics world’s delegate. For best performance, only set bits in the contacts mask for interactions you are interested in.
	 * The default value is 0x00000000 (all bits cleared).
	 */
	setContactTestBitmask:function ( bitmask )
	{
		for ( var idx in this._shapes )
		{
			this._shapes [ idx ].setContactTestBitmask ( bitmask );	
		}			
	},
	
	/**
	 * A mask that defines which categories of physics bodies can collide with this physics body.
	 * When two physics bodies contact each other, a collision may occur. This body’s collision mask is compared to the other body’s category mask by performing a logical AND operation. If the result is a non-zero value, then this body is affected by the collision. Each body independently chooses whether it wants to be affected by the other body. For example, you might use this to avoid collision calculations that would make negligible changes to a body’s velocity.
	 * The default value is 0xFFFFFFFF (all bits set).
	 */
	setCollisionBitmask:function ( bitmask )
	{
		for ( var idx in this._shapes )
		{
			this._shapes [ idx ].setCollisionBitmask ( bitmask );	
		}		
	},
	
	/** Return bitmask of first shape, if there is no shape in body, return default value.(0xFFFFFFFF) */
	getCategoryBitmask:function ( )
	{
		if ( this._shapes.length != 0 )
		{
			return this._shapes [ 0 ].getCategoryBitmask ( );
		}
		else
		{
			return cc.UINT_MAX;
		}			
	},
	
	/** Return bitmask of first shape, if there is no shape in body, return default value.(0x00000000) */
	getContactTestBitmask:function ( )
	{
		if ( this._shapes.length != 0 )
		{
			return this._shapes [ 0 ].getContactTestBitmask ( );
		}
		else
		{
			return 0x00000000;
		}			
	},
	
	/** Return bitmask of first shape, if there is no shape in body, return default value.(0xFFFFFFFF) */
	getCollisionBitmask:function ( ) 
	{
		if ( this._shapes.length != 0 )
		{
			return this._shapes [ 0 ].getCollisionBitmask ( );
		}
		else
		{
			return cc.UINT_MAX;
		}	
	},

	/** 
	 * set the group of body
	 * Collision groups let you specify an integral group index. You can have all fixtures with the same group index always collide (positive index) or never collide (negative index)
	 * it have high priority than bit masks
	 */
	setGroup:function ( group )
	{
		for ( var idx in this._shapes )
		{
			this._shapes [ idx ].setGroup ( group );	
		}
	},
	
	/** Return group of first shape, if there is no shape in body, return default value.(0) */
	getGroup:function ( ) 
	{
		if ( this._shapes.length != 0 )
		{
			return this._shapes [ 0 ].getGroup ( );
		}
		else
		{
			return 0;
		}
	},

	/** get the body position. */
	getPosition:function ( ) 
	{
		var 	vec = this._info.getBody ( ).getPos ( );
		return cp.v.sub ( vec, this._positionOffset );
	},
	
	/** get the body rotation. */
	getRotation:function ( ) 
	{
		return -( this._info.getBody ( ).a * ( 180.0 / Math.PI ) ) - this._rotationOffset;
	},

	/** set body position offset, it's the position witch relative to node */
	setPositionOffset:function ( position )
	{
		if ( !cp.v.eql ( this._positionOffset, position ) )
		{
			var 	pos = this.getPosition ( );
			this._positionOffset = position;
			this.setPosition ( pos );
		}
	},
	
	/** get body position offset. */
	getPositionOffset:function ( )
	{
		return this._positionOffset;
	},
	
	/** set body rotation offset, it's the rotation witch relative to node */
	setRotationOffset:function ( rotation )
	{
		if ( Math.abs ( this._rotationOffset - rotation ) > 0.5 )
		{
			var 	rot = this.getRotation ( );
			this._rotationOffset = rotation;
			this.setRotation ( rot );
		}
	},
	
	/** set the body rotation offset */
	getRotationOffset:function ( ) 
	{
		return this._rotationOffset;
	},

	/**
	 * @brief test the body is dynamic or not.
	 * a dynamic body will effect with gravity.
	 */
	isDynamic:function ( ) 
	{
		return this._dynamic; 
	},
	
	/**
	 * @brief set dynamic to body.
	 * a dynamic body will effect with gravity.
	 */
	setDynamic:function ( dynamic )
	{
		if ( dynamic != this._dynamic )
		{
			this._dynamic = dynamic;
			if ( dynamic )
			{
				this._info.getBody ( ).setMass ( this._mass );
				this._info.getBody ( ).setMoment ( this._moment );
			
				if ( this._world != null )
				{
					// reset the gravity enable
					if ( this.isGravityEnabled ( ) )
					{
						this._gravityEnabled = false;
						this.setGravityEnable ( true );
					}
					
					this._world._info.getSpace ( ).addBody ( this._info.getBody ( ) );
				}
			}
			else
			{
				if ( this._world != null )
				{
					this._world._info.getSpace ( ).removeBody ( this._info.getBody ( ) );
				}

				// avoid incorrect collion simulation.
				this._info.getBody ( ).setMass ( cc.PHYSICS_INFINITY );
				this._info.getBody ( ).setMoment ( cc.PHYSICS_INFINITY );
				this._info.getBody ( ).setVel ( cp.vzero );
				this._info.getBody ( ).setAngVel ( 0 );
					
				this.resetForces ( );
			}

		}
	},

	/**
	 * @brief set the body mass.
	 * @note if you need add/subtract mass to body, don't use setMass(getMass() +/- mass), because the mass of body may be equal to PHYSICS_INFINITY, it will cause some unexpected result, please use addMass() instead.
	 */
	setMass:function ( mass )
	{
		if ( mass <= 0 )
		{
			return;
		}

		var		oldMass = this._mass;
		this._mass = mass;
		this._massDefault = false;

		// update density
		if ( this._mass == cc.PHYSICS_INFINITY )
		{
			this._density = cc.PHYSICS_INFINITY;
		}
		else
		{
			if ( this._area > 0 )
			{
				this._density = this._mass / this._area;
			}
			else
			{
				this._density = 0;
			}
		}

		// the static body's mass and moment is always infinity
		if ( this._dynamic )
		{
			this.updateMass ( oldMass, this._mass );
		}
	},
	
	/** get the body mass. */
	getMass:function ( ) 
	{ 
		return this._mass; 
	},
	
	/**
	 * @brief add mass to body.
	 * if _mass(mass of the body) == PHYSICS_INFINITY, it remains.
	 * if mass == PHYSICS_INFINITY, _mass will be PHYSICS_INFINITY.
	 * if mass == -PHYSICS_INFINITY, _mass will not change.
	 * if mass + _mass <= 0, _mass will equal to MASS_DEFAULT(1.0)
	 * other wise, mass = mass + _mass;
	 */
	addMass:function ( mass )
	{
		var 	oldMass = this._mass;

		if ( mass == cc.PHYSICS_INFINITY )
		{
			this._mass = cc.PHYSICS_INFINITY;
			this._massDefault = false;
			this._density = cc.PHYSICS_INFINITY;
		}
		else if ( mass == -cc.PHYSICS_INFINITY )
		{
			return;
		}
		else
		{
			if ( this._massDefault )
			{
				this._mass = 0;
				this._massDefault = false;
			}

			if ( this._mass + mass > 0 )
			{
				this._mass +=  mass;
			}
			else
			{
				this._mass = cc.MASS_DEFAULT;
				this._massDefault = true;
			}

			if ( this._area > 0 )
			{
				this._density = this._mass / this._area;
			}
			else
			{
				this._density = 0;
			}
		}

		// the static body's mass and moment is always infinity
		if ( this._dynamic )
		{
			this.updateMass ( oldMass, this._mass );
		}		
	},

	/**
	 * @brief set the body moment of inertia.
	 * @note if you need add/subtract moment to body, don't use setMoment(getMoment() +/- moment), because the moment of body may be equal to PHYSICS_INFINITY, it will cause some unexpected result, please use addMoment() instead.
	 */
	setMoment:function ( moment )
	{
		this._moment = moment;
		this._momentDefault = false;

		// the static body's mass and moment is always infinity
		if ( this._rotationEnabled && this._dynamic )
		{
			this._info.getBody ( ).setMoment ( this._moment );
		}		
	},
	
	/** get the body moment of inertia. */
	getMoment:function ( ) 
	{
		return this._moment; 
	},
	
	/**
	 * @brief add moment of inertia to body.
	 * if _moment(moment of the body) == PHYSICS_INFINITY, it remains.
	 * if moment == PHYSICS_INFINITY, _moment will be PHYSICS_INFINITY.
	 * if moment == -PHYSICS_INFINITY, _moment will not change.
	 * if moment + _moment <= 0, _moment will equal to MASS_DEFAULT(1.0)
	 * other wise, moment = moment + _moment;
	 */
	addMoment:function ( moment )
	{
		if ( moment == cc.PHYSICS_INFINITY )
		{
			// if moment is PHYSICS_INFINITY, the moment of the body will become PHYSICS_INFINITY
			this._moment = cc.PHYSICS_INFINITY;
			this._momentDefault = false;
		}
		else if ( moment == -cc.PHYSICS_INFINITY )
		{
			return;
		}
		else
		{
			// if moment of the body is PHYSICS_INFINITY is has no effect
			if ( this._moment != cc.PHYSICS_INFINITY )
			{
				if ( this._momentDefault )
				{
					this._moment = 0;
					this._momentDefault = false;
				}

				if ( this._moment + moment > 0 )
				{
					this._moment += moment;
				}
				else
				{
					this._moment = cc.MOMENT_DEFAULT;
					this._momentDefault = true;
				}
			}
		}

		// the static body's mass and moment is always infinity
		if ( this._rotationEnabled && this._dynamic )
		{
			this._info.getBody ( ).setMoment ( this._moment );
		}
	},
	
	/** get linear damping. */
	getLinearDamping:function ( ) 
	{ 
		return this._linearDamping; 
	},
	
	/** 
	 * set linear damping.
	 * it is used to simulate fluid or air friction forces on the body. 
	 * the value is 0.0f to 1.0f. 
	 */
	setLinearDamping:function ( damping )
	{ 
		this._linearDamping = damping;
		this.updateDamping ( ); 
	},
	
	/** get angular damping. */
	getAngularDamping:function ( ) 
	{
		return this._angularDamping; 
	},
	
	/**
	 * set angular damping.
	 * it is used to simulate fluid or air friction forces on the body.
	 * the value is 0.0f to 1.0f.
	 */
	setAngularDamping:function ( damping )
	{
		this._angularDamping = damping;
		this.updateDamping ( ); 
	},

	/** whether the body is at rest */
	isResting:function ( )
	{
		return this._info.getBody ( ).nodeRoot != null;		
	},
	
	/** set body to rest */
	setResting:function ( rest )
	{
		if ( rest && !this.isResting ( ) )
		{
			this._info.getBody ( ).sleep ( );			
		}
		else if ( !rest && isResting ( ) )
		{
			this._info.getBody ( ).activate ( );
		}
	},
	
	/** 
	 * whether the body is enabled
	 * if the body it isn't enabled, it will not has simulation by world
	 */
	isEnabled:function ( ) 
	{
		return this._enabled; 
	},
	
	/**
	 * set the enable value.
	 * if the body it isn't enabled, it will not has simulation by world
	 */
	setEnable:function ( enable )
	{
		if ( this._enabled != enable )
		{
			this._enabled = enable;

			if ( this._world )
			{
				if ( enable )
				{
					this._world.addBodyOrDelay ( this );
				}
				else
				{
					this._world.removeBodyOrDelay ( this );
				}
			}
		}
	},

	/** whether the body can rotation */
	isRotationEnabled:function ( ) 
	{
		return this._rotationEnabled; 
	},
	
	/** set the body is allow rotation or not */
	setRotationEnable:function ( enable )
	{		
		if ( this._rotationEnabled != enable )
		{
			this._info.getBody ( ).setMoment ( enable ? this._moment : cc.PHYSICS_INFINITY );			
			this._rotationEnabled = enable;
		}		
	},

	/** whether this physics body is affected by the physics world’s gravitational force. */
	isGravityEnabled:function ( ) 
	{ 
		return this._gravityEnabled; 
	},
	
	/** set the body is affected by the physics world's gravitational force or not. */
	setGravityEnable:function ( enable )
	{		
		if ( this._gravityEnabled != enable )
		{
			this._gravityEnabled = enable;

			if ( this._world != null )
			{
				if ( enable )
				{
					this.applyForce ( cp.v.mult ( this._world.getGravity ( ), this._mass ) );
				}
				else
				{
					this.applyForce ( cp.v.mult ( cp.v.neg ( this._world.getGravity ( ) ), this._mass ) );
				}
			}
		}		
	},

	/** get the body's tag */
	getTag:function ( ) 
	{
		return this._tag; 
	},
	
	/** set the body's tag */
	setTag:function ( tag )
	{
		this._tag = tag; 
	},

	/** convert the world point to local */
	world2Local:function ( point )
	{
		return this._info.getBody ( ).world2Local ( point );					
	},
	
	/** convert the local point to world */
	local2World:function ( point )
	{
		return this._info.getBody ( ).local2World ( point );				
	},
	
	setPosition:function ( position )
	{
		this._info.getBody ( ).setPos ( cp.v.add ( position, this._positionOffset ) )		
	},
	
	setRotation:function ( rotation )
	{
		this._info.getBody ( ).setAngle ( -( ( rotation + this._rotationOffset ) * ( Math.PI / 180.0 ) ) );		
	},
	
	setScale:function ( scale, scaleY )
	{
		if ( scaleY === undefined )
		{
			for ( var idx in this._shapes )
			{
				var		shape = this._shapes [ idx ];
				shape.setScale ( scale );
			}				
		}
		else 
		{
			for ( var idx in this._shapes )
			{
				var		shape = this._shapes [ idx ];
				shape.setScale ( scale, scaleY );
			}	
		}
	},
	
	setScaleX:function ( scaleX )
	{
		for ( var idx in this._shapes )
		{
			var		shape = this._shapes [ idx ];
			shape.setScaleX ( scaleX );
		}
	},
	
	setScaleY:function ( scaleY )
	{
		for ( var idx in this._shapes )
		{
			var		shape = this._shapes [ idx ];
			shape.setScaleY ( scaleY );
		}
	},

	update:function ( delta )
	{		
		if ( this._node != null )
		{
			for ( var idx in this._shapes )
			{
				this._shapes [ idx ].update ( delta );				
			}
			
			var		parent = this._node.getParent ( );
			var 	scene  = this._world.getScene ( );

			var		position = this.getPosition ( );
			
			var 	position = parent != scene ? parent.convertToNodeSpace ( scene.convertToWorldSpace ( this.getPosition ( ) ) ) : this.getPosition ( );
			var 	rotation = this.getRotation ( );
			for ( ; parent != scene; parent = parent.getParent ( ) )
			{
				rotation -= parent.getRotation ( );
			}

			this._positionResetTag = true;
			this._rotationResetTag = true;
			this._node.setPosition ( position );
			this._node.setRotation ( rotation );
			this._positionResetTag = false;
			this._rotationResetTag = false;

			// damping compute
			if ( this._isDamping && this._dynamic && !this.isResting ( ) )
			{
				this._info.getBody ( ).v.x *= clamp ( 1.0 - delta * this._linearDamping , 0.0, 1.0 );
				this._info.getBody ( ).v.y *= clamp ( 1.0 - delta * this._linearDamping , 0.0, 1.0 );
				this._info.getBody ( ).w   *= clamp ( 1.0 - delta * this._angularDamping, 0.0, 1.0 );
			}
		}		
	},

	removeJoint:function ( joint )
	{
		var		idx = this._joints.indexOf ( joint );
		if ( idx != -1 )
		{
			this._joints.splice ( idx, 1 );
		}
	},

	updateDamping:function ( )
	{
		this._isDamping = this._linearDamping != 0.0 || this._angularDamping != 0.0; 
	},

	updateMass:function ( oldMass, newMass )
	{		
		if ( this._dynamic && !this._gravityEnabled && this._world != null && oldMass != cc.PHYSICS_INFINITY )
		{
			this.applyForce ( cp.v.mult ( this._world.getGravity ( ), oldMass ) );
		}

		this._info.getBody ( ).setMass ( newMass );

		if ( this._dynamic && !this._gravityEnabled && this._world != null && newMass != cc.PHYSICS_INFINITY )
		{
			this.applyForce ( cp.v.mult ( cp.v.neg ( this._world.getGravity ( ) ), newMass ) );
		}		
	},
});

/** create a body with mass and moment. */
cc.PhysicsBody.create = function ( mass, moment )
{	
	return new cc.PhysicsBody ( mass, moment );
};

/** Create a body contains a circle shape. */
cc.PhysicsBody.createCircle = function ( radius, material, offset )
{
	if ( material 	=== undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSBODY_MATERIAL_DEFAULT );	
	if ( offset	 	=== undefined )	offset 	 = cp.vzero;

	var 	body = new cc.PhysicsBody ( );
	body.addShape ( cc.PhysicsShapeCircle.create ( radius, material, offset ) );

	return body;	
};

/** Create a body contains a box shape. */
cc.PhysicsBody.createBox = function ( size, material, offset )
{
	if ( material 	=== undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSBODY_MATERIAL_DEFAULT );	
	if ( offset	 	=== undefined )	offset 	 = cp.vzero;
	
	var 	body = new cc.PhysicsBody ( );
	body.addShape ( cc.PhysicsShapeBox.create ( size, material, offset ) );
	
	return body;	
};

/**
 * @brief Create a body contains a polygon shape.
 * points is an array of Vec2 structs defining a convex hull with a clockwise winding.
 */
cc.PhysicsBody.createPolygon = function ( points, material, offset )
{
	if ( material 	=== undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSBODY_MATERIAL_DEFAULT );	
	if ( offset	 	=== undefined )	offset 	 = cp.vzero;
	
	var 	body = new cc.PhysicsBody ( );
	body.addShape ( cc.PhysicsShapePolygon.create ( points, material, offset ) );
	
	return body;	
};

/** Create a body contains a EdgeSegment shape. */
cc.PhysicsBody.createEdgeSegment = function ( a, b, material, border )
{
	if ( material 	=== undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSBODY_MATERIAL_DEFAULT );	
	if ( border	 	=== undefined )	border 	 = 1;
	
	var 	body = new cc.PhysicsBody ( );
	body.addShape ( cc.PhysicsShapeEdgeSegment.create ( a, b, material, border ) );
	body._dynamic = false;

	return body;	
};

//static PhysicsBody* createEdgeSegment(const Vec2& a, const Vec2& b, const PhysicsMaterial& material = PHYSICSBODY_MATERIAL_DEFAULT, float border = 1);

/** Create a body contains a EdgeBox shape. */
cc.PhysicsBody.createEdgeBox = function ( size, material, border, offset )
{	
	if ( material 	=== undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSBODY_MATERIAL_DEFAULT );	
	if ( border 	=== undefined )	border 	 = 1;
	if ( offset	 	=== undefined )	offset 	 = cp.vzero;
	
	var 	body = new cc.PhysicsBody ( );
	body.addShape ( cc.PhysicsShapeEdgeBox.create ( size, material, border, offset ) );
	body._dynamic = false;
	
	return body;
};

/** Create a body contains a EdgePolygon shape. */
cc.PhysicsBody.createEdgePolygon = function ( points, material, border )
{
	if ( material 	=== undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSBODY_MATERIAL_DEFAULT );	
	if ( border	 	=== undefined )	border 	 = 1;
	
	var 	body = new cc.PhysicsBody ( );
	body.addShape ( cc.PhysicsShapeEdgePolygon.create ( points, material, border ) );
	body._dynamic = false;
	
	return body;	
};

/** Create a body contains a EdgeChain shape. */
cc.PhysicsBody.createEdgeChain = function ( points, material, border )
{
	if ( material 	=== undefined )	material = cc.PhysicsMaterial.clone ( cc.PHYSICSBODY_MATERIAL_DEFAULT );	
	if ( border	 	=== undefined )	border 	 = 1;
	
	var 	body = new cc.PhysicsBody ( );
	body.addShape ( cc.PhysicsShapeEdgeChain.create ( points, material, border ) );
	body._dynamic = false;
	
	return body;	
};
