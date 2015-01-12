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

cc.PHYSICS_INFINITY = Infinity;

cc.PhysicsRayCastInfo = function ( _shape, _start, _end, _contact, _normal, _fraction )
{
	return { shape : _shape, start : _start, end : _end, contact : _contact, normal : _normal, fraction : _fraction }; 
};

cc.PhysicsWorldCallback =
{
	continues : false,
	
	collisionBeginCallbackFunc:function ( arb, space )
	{				
		var 	shapes = arb.getShapes ( );
		var		a      = shapes [ 0 ].userdata.getShape ( );
		var		b      = shapes [ 1 ].userdata.getShape ( );
		
		var		contact = new cc.PhysicsContact ( a, b );
		arb.data = contact;
		contact._contactInfo = arb;				
		return this.collisionBeginCallback ( contact );
	},

	collisionPreSolveCallbackFunc:function ( arb, space )
	{
		if ( arb.data === undefined )
		{
			return true;
		}
		
		return this.collisionPreSolveCallback ( arb.data );
	},
	
	collisionPostSolveCallbackFunc:function ( arb, space )
	{
		if ( arb.data === undefined )
		{
			return;
		}
		
		this.collisionPostSolveCallback ( arb.data );
	},

	collisionSeparateCallbackFunc:function ( arb, space )
	{
		if ( arb.data === undefined )
		{
			return true;
		}		
		
		var		contact = arb.data;		
		this.collisionSeparateCallback ( contact );			
		contact = arb.data = null;
	},
};

cc.PhysicsWorldCallback.continues = true;

	

/**
 * @brief An PhysicsWorld object simulates collisions and other physical properties. You do not create PhysicsWorld objects directly; instead, you can get it from an Scene object.
 */
cc.PhysicsWorld = cc.Class.extend
({		
	_TempBug : null,
	
	ctor:function ( scene ) 
	{
		/////////////////////////////////////
		// Avoid Bug - Temporary code.
		if ( cc.PhysicsWorld_TempBug != null )
		{
			cc.PhysicsWorld_TempBug._info.getSpace ( ).setDefaultCollisionHandler ( null, null, null, null );
		}		
		cc.PhysicsWorld_TempBug = this;
		///////////////////////////////
		
		
		this._gravity			= cp.v ( 0, -98.0 );
		this._speed				= 1;
		this._updateRate		= 1;
		this._updateRateCount 	= 0;
		this._updateTime		= 0;
		this._substeps			= 1;
		this._info				= null;

		this._bodies			= new Array ( );
		this._joints			= new Array ( );
		this._scene				= null;

		this._delayDirty		= false;
		this._autoStep			= true;
		this._debugDraw			= null; 
		this._debugDrawMask		= cc.PhysicsWorld.DEBUGDRAW_NONE;

		this._delayAddBodies	= new Array ( );
		this._delayRemoveBodies = new Array ( );
		this._delayAddJoints	= new Array ( );
		this._delayRemoveJoints = new Array ( );
		
		this.init ( scene );
	},
	
	init:function ( scene )
	{		
		this._info = new cc.PhysicsWorldInfo ( );
		temp = this._info;
		
		this._scene = scene;

		this._info.setGravity ( this._gravity );
		
		this._debugDraw = new cc.PhysicsDebugNode ( this._info._space );
		this._debugDraw.setVisible ( false );
		this._scene.addChild ( this._debugDraw, 1 );	
		
		this._info.getSpace ( ).setDefaultCollisionHandler 
		(
			cc.PhysicsWorldCallback.collisionBeginCallbackFunc	  .bind ( this ),
			cc.PhysicsWorldCallback.collisionPreSolveCallbackFunc .bind ( this ),
			cc.PhysicsWorldCallback.collisionPostSolveCallbackFunc.bind ( this ),
			cc.PhysicsWorldCallback.collisionSeparateCallbackFunc .bind ( this )			
		);
		
		return true;
	},
	
	release:function ( )
	{
		this._info.getSpace ( ).setDefaultCollisionHandler ( null, null, null, null );		
	},

	/** Adds a joint to the physics world.*/
	addJoint:function ( joint )
	{
	    if ( joint.getWorld ( ) != null && joint.getWorld ( ) != this )
	    {
	        joint.removeFormWorld ( );
	    }
	    
	    this.addJointOrDelay ( joint );
	    this._joints.push ( joint );
	    joint._world = this;
	},

	/** Remove a joint from physics world.*/
	removeJoint:function ( joint, destroy )
	{
		if ( destroy === undefined )	destroy = true;
				
		if ( joint.getWorld ( ) != this )
		{
			if ( destroy )
			{
				cc.log ( "physics warnning: the joint is not in this world, it won't be destoried utill the body it conntect is destoried" );
			}
			return;
		}

		this.removeJointOrDelay ( joint );

		var  	idx = this._joints.indexOf ( joint );
		if ( idx != -1 )
		{
			this._joints.splice ( idx, 1 );
		}		
		joint._world = null;

		// clean the connection to this joint
		if ( destroy )
		{
			if ( joint.getBodyA ( ) != null )
			{
				joint.getBodyA ( ).removeJoint ( joint );
			}

			if ( joint.getBodyB ( ) != null )
			{
				joint.getBodyB ( ).removeJoint ( joint );
			}

			// test the distraction is delaied or not
			var 	idx = this._delayRemoveJoints.indexOf ( joint );
			if ( idx != -1 )
			{
				joint._destoryMark = true;
			}
			else
			{
				delete joint;
			}
		}		
	},

	/** Remove all joints from physics world.*/
	removeAllJoints:function ( destroy )
	{
		if ( destroy === undefined )	destroy = true;
		
		for ( var idx in this._joints )
		{
			var		joint = this._joints [ idx ];
			this.removeJointOrDelay (joint );
			joint._world = null; 

			// clean the connection to this joint
			if ( destroy )
			{
				if ( joint.getBodyA ( ) != null )
				{
					joint.getBodyA ( ).removeJoint ( joint );
				}

				if ( joint.getBodyB ( ) != null )
				{
					joint.getBodyB ( ).removeJoint ( joint );
				}

				// test the distraction is delaied or not
				var		idx2 = this._delayRemoveJoints.indexOf ( joint );
				if ( idx2 != -1 )				
				{
					joint._destoryMark = true;
				}
				else
				{
					delete joint;
				}
			}
		}

		this._joints.splice ( 0, this._joints.length );
	},

	/** Remove a body from physics world. */
	/** Remove body by tag. */
	removeBody:function ( val )
	{
		if ( val instanceof cc.PhysicsBody )
		{
			var		body = val;
			
			if ( body.getWorld ( ) != this )
			{
				cc.log ( "Physics Warnning: this body doesn't belong to this world" );
				return;
			}
						
			// destory the body's joints
			for ( var idx in body._joints )
			{
				var		joint = body._joints [ idx ];

				// set destroy param to false to keep the iterator available
				this.removeJoint ( joint, false );

				var		other = ( joint.getBodyA ( ) == body ? joint.getBodyB ( ) : joint.getBodyA ( ) );
				other.removeJoint ( joint );

				// test the distraction is delaied or not
				var		idx2 = this._delayRemoveJoints.indexOf ( joint );
				if ( idx2 != -1 )
				{
					joint._destoryMark = true;
				}
				else
				{
					delete joint;
				}				
			}

			body._joints.splice ( 0, body._joints.length );

			this.removeBodyOrDelay ( body );						
			this._bodies.splice ( this._bodies.indexOf ( body ), 1 );				
			body._world = null;
		}
		else
		{
			var		tag = val;
			
			for ( var idx in this._bodies )
			{
				var		body = this._bodies [ idx ];
				if ( body.getTag ( ) == tag )
				{
					this.removeBody ( body );
					return;
				}
			}
		}
	},

	/** Remove all bodies from physics world. */
	removeAllBodies:function ( )
	{
		for ( var idx in this._bodies )
		{
			var		child = this._bodies [ idx ];
			this.removeBodyOrDelay ( child );
			child._world = null;
		}

		this._bodies.splice ( 0, this._bodies.length );
	},

	/** Searches for physics shapes that intersects the ray. */
	rayCast:function ( func, start, end, data )
	{
		cc.assert ( func != null, "func shouldn't be nullptr" );
		
		var		self = this;

		if ( func != null )
		{
			cc.PhysicsWorldCallback.continues = true;
			this._info._space.segmentQuery ( start, end, cp.ALL_LAYERS, cp.NO_GROUP, function ( shape, t, n ) 
			{
				if ( !cc.PhysicsWorldCallback.continues )
				{
					return;
				}
				
				if ( shape.userdata != null )
				{									
					var		callbackInfo = cc.PhysicsRayCastInfo 
					(
						shape.userdata.getShape ( ),
						start,
						end,
						cp.v ( start.x + ( end.x - start.x ) * t, start.y + ( end.y - start.y ) * t ),
						cp.v ( n.x, n.y ),
						t
					);
					
					cc.PhysicsWorldCallback.continues = func ( self, callbackInfo, data );					
				}
				else 
				{
					cc.assert ( false, "Error" );	
				}							
			});			
		}
	},

	/** Searches for physics shapes that contains in the rect. */
	queryRect:function ( func, rect, data )
	{

	},

	/** Searches for physics shapes that contains the point. */
	queryPoint:function ( func, point, data )
	{

	},

	/** Get phsyics shapes that contains the point. */
	getShapes:function ( point ) 
	{
		var 	shapes = new Array ( );

		this._info._space.nearestPointQuery ( point, 0, cp.ALL_LAYERS, cp.NO_GROUP, function ( shape, distance, point )
        {
        	shapes.push ( shape.userdata.getShape ( ) );        		        	        	
        });
	    
	    return shapes;		
	},
	
	/** return physics shape that contains the point. */
	getShape:function ( point )
	{
		var 	info = this._info._space.nearestPointQueryNearest ( point, 0, cp.ALL_LAYERS, cp.NO_GROUP );		
		if ( info )
		{				
        	return info.shape.userdata.getShape ( );        		
		}
		
		return null;
	},
	
	/** Get all the bodys that in the physics world. */
	getAllBodies:function ( )
	{
		return this._bodies;
	},
	
	/** Get body by tag */
	getBody:function ( tag ) 
	{
		for ( var idx in this._bodies )
		{
			var		body = this._bodies [ idx ];
			if ( body.getTag ( ) == tag )
			{
				return body;
			}
		}

		return null;
	},

	/** Get scene contain this physics world */
	getScene:function ( )  
	{
		return this._scene;
	},
	
	/** get the gravity value */
	getGravity:function ( ) 
	{
		return this._gravity; 
	},
	
	/** set the gravity value */
	setGravity:function ( gravity )
	{
		if ( this._bodies.length != 0 )
		{
			for ( var idx in this._bodies )
			{
				var		body = this._bodies [ idx ];
				
				// reset gravity for body
				if ( !body.isGravityEnabled ( ) )
				{
					body.applyForce ( cp.v.mult ( ( cp.v.sub ( this._gravity, gravity ) ), body.getMass ( ) ) );
				}
			}
		}

		this._gravity = gravity;
		this._info.setGravity ( gravity );
	},
	
	/** Set the speed of physics world, speed is the rate at which the simulation executes. default value is 1.0 */
	setSpeed:function ( speed ) 
	{ 
		if ( speed >= 0.0 )
		{
			this._speed = speed; 
		} 
	},
	
	/** get the speed of physics world */
	getSpeed:function ( ) 
	{
		return this._speed; 
	},
	
	/** 
	 * set the update rate of physics world, update rate is the value of EngineUpdateTimes/PhysicsWorldUpdateTimes.
	 * set it higher can improve performance, set it lower can improve accuracy of physics world simulation.
	 * default value is 1.0
	 */
	setUpdateRate:function ( rate ) 
	{
		if ( rate > 0 ) 
		{
			this._updateRate = rate; 
		}
	},
	
	/** get the update rate */
	getUpdateRate:function ( )
	{
		return this._updateRate; 
	},

	/**
	 * set the number of substeps in an update of the physics world.
	 * One physics update will be divided into several substeps to increase its accuracy.
	 * default value is 1
	 */
	setSubsteps:function ( steps )
	{
		if ( steps > 0 )
		{
			this._substeps = steps;
			if ( steps > 1 )
			{
				this._updateRate = 1;
			}
		}		
	},
	
	/** get the number of substeps */
	getSubsteps:function ( ) 
	{
		return this._substeps; 
	},
	
	/** set the debug draw mask */
	setDebugDrawMask:function ( mask )
	{
		if ( mask == cc.PhysicsWorld.DEBUGDRAW_NONE )
		{
			this._debugDraw.setVisible ( false );	
		}
		else
		{
			this._debugDraw.setVisible ( true );
		}

		this._debugDrawMask = mask;
	},
	
	/** get the bebug draw mask */
	getDebugDrawMask:function ( )
	{
		return this._debugDrawMask; 
	},

	/**
	 * To control the step of physics, if you want control it by yourself( fixed-timestep for example ), you can set this to false and call step by yourself.
	 * Defaut value is true.
	 * Note: if you set auto step to false, setSpeed setSubsteps and setUpdateRate won't work, you need to control the time step by yourself.
	 */
	setAutoStep:function ( autoStep )
	{
		this._autoStep = autoStep; 
	},
	
	/** Get the auto step */
	isAutoStep:function ( )
	{
		return this._autoStep; 
	},
	
	/**
	 * The step for physics world, The times passing for simulate the physics.
	 * Note: you need to setAutoStep(false) first before it can work.
	 */
	step:function ( delta )
	{
		if ( this._autoStep )
		{
			cc.log ( "Physics Warning: You need to close auto step( setAutoStep(false) ) first" );
		}
		else
		{
			this.update ( delta, true );
		}
	},
	
	addBody:function ( body )
	{
		cc.assert ( body != null, "the body can not be nullptr" );

		if ( body.getWorld ( ) == this )
		{
			return;
		}

		if ( body.getWorld ( ) != null )
		{
			body.removeFromWorld ( );
		}

		this.addBodyOrDelay ( body );
		this._bodies.push ( body );
		body._world = this;
	},
	
	addShape:function ( shape )
	{
		if ( shape != null )
		{
			this._info.addShape ( shape._info );
		}
	},

	removeShape:function ( shape )
	{
		if ( shape != null )
		{
			this._info.removeShape ( shape._info );

			// Temporary Code
			shape._info.removeAll ( );
		}
	},

	update:function ( delta, userCall )
	{
		if ( userCall === undefined )	userCall = false;

		while ( this._delayDirty )
		{
			// the updateJoints must run before the updateBodies.
			this.updateJoints ( );
			this.updateBodies ( );
			this._delayDirty = !( this._delayAddBodies.length == 0 && this._delayRemoveBodies.length == 0 && this._delayAddJoints.length == 0 && this._delayRemoveJoints.length == 0 );
		}

		if ( userCall )
		{
			this._info.step ( delta );
			for ( var idx in this._bodies )
			{
				var		body = this._bodies [ idx ];
				body.update ( delta );
			}
		}
		else
		{
			this._updateTime += delta;
			if ( ++this._updateRateCount >= this._updateRate )
			{
				var 	dt = this._updateTime * this._speed / this._substeps;
				for ( var i = 0; i < this._substeps; ++i )
				{					
					this._info.step ( dt );
					for ( var idx in this._bodies )
					{
						var		body = this._bodies [ idx ];
						body.update ( dt );
					}
				}
				this._updateRateCount = 0;
				this._updateTime = 0.0;
			}
		}
	},

	collisionBeginCallback:function ( contact )
	{				
		var 	ret = true;

		var 	shapeA  = contact.getShapeA ( );
		var 	shapeB  = contact.getShapeB ( );
		var 	bodyA   = shapeA.getBody ( );
		var 	bodyB   = shapeB.getBody ( );
		
		var 	jointsA = bodyA.getJoints ( );

		// check the joint is collision enable or not
		for ( var idx in jointsA )
		{
			var		joint = jointsA [ idx ];

			var		idx2 = this._joints.indexOf ( joint );
			if ( idx == -1 )
			{
				continue;
	        }
	        
			if ( !joint.isCollisionEnabled ( ) )
	        {
	        	var 	body = joint.getBodyA ( ) == bodyA ? joint.getBodyB ( ) : joint.getBodyA ( );
	            
	            if ( body == bodyB )
	            {
	                contact.setNotificationEnable ( false );
	                return false;
	            }
	        }
	    }

	    // bitmask check
		if ( ( shapeA.getCategoryBitmask ( ) & shapeB.getContactTestBitmask ( ) ) == 0 ||
			 ( shapeA.getContactTestBitmask ( ) & shapeB.getCategoryBitmask ( ) ) == 0 )
	    {
	        contact.setNotificationEnable ( false );
	    }
	    
	    if ( shapeA.getGroup ( ) != 0 && shapeA.getGroup ( ) == shapeB.getGroup ( ) )
	    {
	        ret = shapeA.getGroup ( ) > 0;
	    }
	    else
	    {
	    	if ( ( shapeA.getCategoryBitmask ( ) & shapeB.getCollisionBitmask ( ) ) == 0 ||
	    		 ( shapeB.getCategoryBitmask ( ) & shapeA.getCollisionBitmask ( ) ) == 0 )
	    	{
	            ret = false;
	        }
	    }
	    
	    if ( contact.isNotificationEnabled ( ) )
	    {
	        contact.setEventCode ( cc.PhysicsContact.EventCode.BEGIN );
	        contact.setWorld ( this );
//	        this._scene.getEventDispatcher ( ).dispatchEvent ( contact );
	        cc.eventManager.dispatchCustomEvent ( cc.PHYSICSCONTACT_EVENT_NAME, contact );
	    }
	    
	    return ret ? contact.resetResult ( ) : false;	    
	},
	
	collisionPreSolveCallback:function ( contact )
	{			
		if ( !contact.isNotificationEnabled ( ) )
		{
			contact._contactInfo.state = 'ignore';			
			return true;
		}

		contact.setEventCode ( cc.PhysicsContact.EventCode.PRESOLVE );
		contact.setWorld ( this );
//		this._scene.getEventDispatcher ( ).dispatchEvent ( contact );
		cc.eventManager.dispatchCustomEvent ( cc.PHYSICSCONTACT_EVENT_NAME, contact );

		return contact.resetResult ( );		
	},
			
	collisionPostSolveCallback:function ( contact )
	{			
		if ( !contact.isNotificationEnabled ( ) )
		{
			return;
		}

		contact.setEventCode ( cc.PhysicsContact.EventCode.POSTSOLVE );
		contact.setWorld ( this );
//		this._scene.getEventDispatcher ( ).dispatchEvent ( contact );	
		cc.eventManager.dispatchCustomEvent ( cc.PHYSICSCONTACT_EVENT_NAME, contact );
	},
	
	collisionSeparateCallback:function ( contact )
	{		
		if ( !contact.isNotificationEnabled ( ) )
		{
			return;
		}

		contact.setEventCode ( cc.PhysicsContact.EventCode.SEPERATE );
		contact.setWorld ( this );
//		this._scene.getEventDispatcher ( ).dispatchEvent ( contact );	
		cc.eventManager.dispatchCustomEvent ( cc.PHYSICSCONTACT_EVENT_NAME, contact );
	},

	doAddBody:function ( body )
	{
		if ( body.isEnabled ( ))
		{
			//is gravity enable
			if ( !body.isGravityEnabled ( ) )
			{
				body.applyForce ( cp.v.mult ( cp.v.neg ( this._gravity ), body.getMass ( ) ) );
			}

			// add body to space
			if ( body.isDynamic ( ) )
			{
				this._info.addBody ( body._info );
			}

			// add shapes to space
			var 	shapes = body.getShapes ( );
			for ( var idx in shapes )
			{
				var 	shape = shapes [ idx ];
				this.addShape ( shape );
			}
		}
	},
	
	doRemoveBody:function ( body )
	{
		cc.assert ( body != null, "the body can not be nullptr" );

		// reset the gravity
		if ( !body.isGravityEnabled ( ) )
		{
			body.applyForce ( this._gravity * body.getMass ( ) );
		}

		// remove shaps
		var		shapes = body.getShapes ( );
		for ( var idx in shapes )
		{
			var		shape = shapes [ idx ];
			this.removeShape ( shape );
		}

		// remove body
		this._info.removeBody ( body._info );
	},
	
	doAddJoint:function ( joint )
	{
		if ( joint == null || joint._info == null )
		{
			return;
		}

		this._info.addJoint ( joint._info );
	},
	
	doRemoveJoint:function ( joint )
	{
		this._info.removeJoint ( joint._info );
		
		// Temporary Code
		joint._info.removeAll ( );		
	},
	
	addBodyOrDelay:function ( body )
	{
		var 	removeBodyIdx = this._delayRemoveBodies.indexOf ( body );
		if ( removeBodyIdx != -1 )
		{
			this._delayRemoveBodies.splice ( removeBodyIdx, 1 );			
			return;
		}

		if ( this._info.isLocked ( ) )
		{
			if ( this._delayAddBodies.indexOf ( body ) == -1 )
			{
				this._delayAddBodies.push ( body );
				this._delayDirty = true;
			}
		}
		else
		{
			this.doAddBody ( body );
		}
	},
	
	removeBodyOrDelay:function ( body )
	{
		var		idx = this._delayAddBodies.indexOf ( body );
		if ( idx != -1 )
		{
			this._delayAddBodies.splice ( idx, 1 );
			return;
		}

		if ( this._info.isLocked ( ) )
		{			
			if ( this._delayRemoveBodies.indexOf ( body ) == -1 )
			{
				this._delayRemoveBodies.push ( body );
				this._delayDirty = true;
			}
		}
		else
		{
			this.doRemoveBody ( body );
		}
	},
	
	addJointOrDelay:function ( joint )
	{
		var 	idx = this._delayRemoveJoints.indexOf ( joint );
		if ( idx != -1 )
		{
			this._delayRemoveJoints.splice ( idx, 1 );			
			return;
		}

		if ( this._info.isLocked ( ) )
		{
			if ( this._delayAddJoints.indexOf ( joint ) == -1 )
			{
				this._delayAddJoints.push ( joint );
				this._delayDirty = true;
			}
		}
		else
		{
			this.doAddJoint ( joint );
		}
	},

	removeJointOrDelay:function ( joint )
	{
		var 	idx = this._delayAddJoints.indexOf ( joint );
		if ( idx != -1 )
		{
			this._delayAddJoints.splice ( idx, 1 );			
			return;
		}

		if ( this._info.isLocked ( ) )
		{
			if ( this._delayRemoveJoints.indexOf ( joint ) == -1 )
			{
				this._delayRemoveJoints.push ( joint );
				this._delayDirty = true;
			}
		}
		else
		{
			this.doRemoveJoint ( joint );
		}
	},
	
	updateBodies:function ( )
	{
		if ( this._info.isLocked ( ) )
		{
			return;
		}

		for ( var idx in this._delayAddBodies )
		{
			var		body = this._delayAddBodies [ idx ];
			this.doAddBody ( body );
		}

		for ( var idx in this._delayRemoveBodies )
		{
			var		body = this._delayRemoveBodies [ idx ];
			this.doRemoveBody ( body );
		}

		this._delayAddBodies.splice ( 0, this._delayAddBodies.length );
		this._delayRemoveBodies.splice ( 0, this._delayRemoveBodies.length );		
	},
	
	updateJoints:function ( )
	{
		if ( this._info.isLocked ( ) )
		{
			return;
		}
	    
		for ( var idx in this._delayAddJoints )
		{
			var		joint = this._delayAddJoints [ idx ];
			this.doAddJoint ( joint );
		}

		for ( var idx in this._delayRemoveJoints )
		{
			var		joint = this._delayRemoveJoints [ idx ];
			this.doRemoveJoint ( joint );
			
			if ( joint._destoryMark )
			{
				delete joint;
			}
		}
	},
});

cc.PhysicsWorld.DEBUGDRAW_NONE 		= 0x00;		///< draw nothing
cc.PhysicsWorld.DEBUGDRAW_SHAPE 	= 0x01;		///< draw shapes
cc.PhysicsWorld.DEBUGDRAW_JOINT 	= 0x02;		///< draw joints
cc.PhysicsWorld.DEBUGDRAW_CONTACT 	= 0x04;		///< draw contact
cc.PhysicsWorld.DEBUGDRAW_ALL 		= cc.PhysicsWorld.DEBUGDRAW_SHAPE | cc.PhysicsWorld.DEBUGDRAW_JOINT | cc.PhysicsWorld.DEBUGDRAW_CONTACT;	///< draw all


