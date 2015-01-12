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

/*
 * @brief An PhysicsJoint object connects two physics bodies together.
 */
cc.PhysicsJoint = cc.Class.extend
({	
	ctor:function ( )
	{
		this._bodyA				= null;
		this._bodyB				= null;
		this._world				= null;
		this._info				= null;
		this._enable			= false;
		this._collisionEnable	= true;
		this._destoryMark		= false;
		this._tag				= 0;
	},
	
	init:function ( a, b )
	{
		cc.assert ( a != null && b != null, "the body passed in is nil" );
		cc.assert ( a != b, "the two bodies are equal" );

		this._info = new cc.PhysicsJointInfo ( this );
	
		this._bodyA = a;
		this._bodyA._joints.push ( this );
		this._bodyB = b;
		this._bodyB._joints.push ( this );
	},
	
	getBodyA:function ( ) 
	{
		return this._bodyA; 
	},
	
	getBodyB:function ( )  
	{
		return this._bodyB;
	},
	
	getWorld:function ( )  
	{
		return this._world; 
	},
	
	getTag:function ( )  
	{
		return this._tag;
	},
	
	setTag:function ( tag )
	{
		this._tag = tag;
	},
	
	isEnabled:function ( ) 
	{
		return this._enable; 
	},
	
	/** Enable/Disable the joint */
	setEnable:function ( enable )
	{		
		if ( this._enable != enable )
		{
			this._enable = enable;

			if ( this._world != null )
			{
				if ( enable )
				{
					this._world.addJointOrDelay ( this );
				}
				else
				{
					this._world.removeJointOrDelay ( this );
				}
			}
		}		
	},
	
	isCollisionEnabled:function ( ) 
	{ 
		return this._collisionEnable;
	},
	
	/** Enable/disable the collision between two bodies */
	setCollisionEnable:function ( enable )
	{
		if ( this._collisionEnable != enable )
		{
			this._collisionEnable = enable;
		}
	},
	
	/** Remove the joint from the world */
	removeFormWorld:function ( )
	{
		if ( this._world )
		{
			this._world.removeJoint ( this, false );
		}
	},

	/** Set the max force between two bodies */
	setMaxForce:function ( force )
	{
		var		joints = this._info.getJoints ( );
		for ( var idx in joints )
		{
			var		joint = joints [ idx ];
			joint.maxForce = force;
		}
	},

	/** Get the max force setting */
	getMaxForce:function ( ) 
	{
		return this._info.getJoints ( ) [ 0 ].maxForce;
	},

	/**
	 * PhysicsShape is PhysicsBody's friend class, but all the subclasses isn't. so this method is use for subclasses to catch the bodyInfo from PhysicsBody.
	 */

	getBodyInfo:function ( body ) 
	{
		return body._info;
	},

	getBodyNode:function ( body ) 
	{
		return body._node;
	},	
});

/** Distory the joint*/
cc.PhysicsJoint.destroy = function ( joint )
{	
	if ( joint!= null )
	{
		// remove the joint and delete it.
		if ( joint._world != null )
		{
			joint._world.removeJoint ( joint, true );
		}
		else
		{
			if ( joint._bodyA != null )
			{
				joint._bodyA.removeJoint ( joint );
			}

			if ( joint._bodyB != null )
			{
				joint._bodyB.removeJoint ( joint );
			}

			delete joint;
		}
	}	 
};

/*
 * @brief A fixed joint fuses the two bodies together at a reference point. Fixed joints are useful for creating complex shapes that can be broken apart later.
 */
cc.PhysicsJointFixed = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},
	
	init:function ( a, b, anchr )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		this.getBodyNode ( a ).setPosition ( anchr );
		this.getBodyNode ( b ).setPosition ( anchr );
		
		var 	joint = new cp.PivotJoint ( this.getBodyInfo ( a ).getBody ( ), this.getBodyInfo ( b ).getBody ( ), anchr );				
		if ( joint != null )
		{
			this._info.add ( joint );
			
			// add a gear joint to make two body have the same rotation.
			joint = new cp.GearJoint ( this.getBodyInfo ( a ).getBody ( ), this.getBodyInfo ( b ).getBody ( ), 0, 1 );
			if ( joint != null )
			{
				this._info.add ( joint );				
				this.setCollisionEnable ( false );
				return true;
			}
		}

		return false;		
	},

});

cc.PhysicsJointFixed.create = function ( a, b, anchr )
{
	var		Joint = new cc.PhysicsJointFixed ( );
	Joint.init ( a, b, anchr );
	return Joint;	
};

/*
 * @brief A limit joint imposes a maximum distance between the two bodies, as if they were connected by a rope.
 */
cc.PhysicsJointLimit = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, anchr1, anchr2, min, max )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.SlideJoint ( this.getBodyInfo ( a ).getBody ( ), this.getBodyInfo ( b ).getBody ( ), anchr1, anchr2, min, max );				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},

	getAnchr1:function ( )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.anchr1;
	},
	
	setAnchr1:function ( anchr1 )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.anchr1 = anchr1;
	},
	
	getAnchr2:function ( )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.anchr2;
	},
	
	setAnchr2:function ( anchr2 )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.anchr2 = anchr2;
	},
	
	getMin:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.min;
	},
	
	setMin:function ( min )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.min = min;
	},
	
	getMax:function ( )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.max;
	},
	
	setMax:function ( max )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.max = max;
	},
});

cc.PhysicsJointLimit.create = function ( a, b, anchr1, anchr2, min, max )
{
	if ( min === undefined || max === undefined )	
	{
		min = 0;
		max = cp.v.dist ( b.local2World ( anchr1 ), a.local2World ( anchr2 ) );
	}

	var		Joint = new cc.PhysicsJointLimit ( );
	Joint.init ( a, b, anchr1, anchr2, min, max );
	return Joint;	
};

/*
 * @brief A pin joint allows the two bodies to independently rotate around the anchor point as if pinned together.
 */
cc.PhysicsJointPin = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},
	
	init:function ( a, b, anchr )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.PivotJoint ( this.getBodyInfo ( a ).getBody ( ), this.getBodyInfo ( b ).getBody ( ), anchr );				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}
		
		return false;
	},
});

cc.PhysicsJointPin.create = function ( a, b, anchr )
{
	var		Joint = new cc.PhysicsJointPin ( );
	Joint.init ( a, b, anchr );
	return Joint;	
};

/** Set the fixed distance with two bodies */
cc.PhysicsJointDistance = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, anchr1, anchr2 )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.PinJoint ( this.getBodyInfo ( a ).getBody ( ), this.getBodyInfo ( b ).getBody ( ), anchr1, anchr2 );				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},

	getDistance:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.dist;
	},

	setDistance:function ( distance )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.dist = distance;		
	},
});

cc.PhysicsJointDistance.create = function ( a, b, anchr1, anchr2 )
{
	var		Joint = new cc.PhysicsJointDistance ( );
	Joint.init ( a, b, anchr1, anchr2 );
	return Joint;	
};

/** Connecting two physics bodies together with a spring. */
cc.PhysicsJointSpring = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, anchr1, anchr2, stiffness, damping )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.DampedSpring 
		( 
			this.getBodyInfo ( a ).getBody ( ), 
			this.getBodyInfo ( b ).getBody ( ), 
			anchr1, 
			anchr2,
			cp.v.dist ( this._bodyB.local2World ( anchr1 ), this._bodyA.local2World ( anchr2 ) ), 
			stiffness,
			damping 
		);				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},

	getAnchr1:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.anchr1;
	},

	setAnchr1:function ( anchr1 )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.anchr1 = anchr1;		
	},
	
	getAnchr2:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.anchr2;
	},

	setAnchr2:function ( anchr2 )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.anchr2 = anchr2;		
	},
	
	getRestLength:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.restLength;
	},

	setRestLength:function ( restLength )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.restLength = restLength;		
	},

	getStiffness:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.stiffness;
	},

	setStiffness:function ( stiffness )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.stiffness = stiffness;		
	},

	getDamping:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.damping;
	},

	setDamping:function ( damping )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.damping = damping;		
	},	
});

cc.PhysicsJointSpring.create = function ( a, b, anchr1, anchr2, stiffness, damping )
{
	var		Joint = new cc.PhysicsJointSpring ( );
	Joint.init ( a, b, anchr1, anchr2, stiffness, damping );
	return Joint;	
};

/** Attach body a to a line, and attach body b to a dot */
cc.PhysicsJointGroove = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, grooveA, grooveB, anchr2 )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.GrooveJoint 
		( 
			this.getBodyInfo ( a ).getBody ( ), 
			this.getBodyInfo ( b ).getBody ( ), 
			grooveA, 
			grooveB,
			anchr2
		);				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},
	
	getGrooveA:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.grooveA;
	},
	
	setGrooveA:function ( grooveA )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.grooveA = grooveA;		
	},

	getGrooveB:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.grooveB;
	},
	
	setGrooveB:function ( grooveB )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.grooveB = grooveB;		
	},
	
	getAnchr2:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.anchr2;
	},

	setAnchr2:function ( anchr2 )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.anchr2 = anchr2;		
	},
});

cc.PhysicsJointGroove.create = function ( a, b, grooveA, grooveB, anchr2 )
{
	var		Joint = new cc.PhysicsJointGroove ( );
	Joint.init ( a, b, grooveA, grooveB, anchr2 );
	return Joint;	
};

/** Likes a spring joint, but works with rotary */
cc.PhysicsJointRotarySpring = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, stiffness, damping )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.DampedRotarySpring 
		( 
			this.getBodyInfo ( a ).getBody ( ), 
			this.getBodyInfo ( b ).getBody ( ),
			this._bodyB.getRotation ( ) - this._bodyA.getRotation ( ),
			stiffness,
			damping
		);				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},

	getRestAngle:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.restAngle;
	},

	setRestAngle:function ( restAngle )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.restAngle = restAngle;		
	},
	
	getStiffness:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.stiffness;
	},

	setStiffness:function ( stiffness )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.stiffness = stiffness;		
	},
	
	getDamping:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.damping;
	},

	setDamping:function ( damping )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.damping = damping;		
	},	
});

cc.PhysicsJointRotarySpring.create = function ( a, b, stiffness, damping )
{
	var		Joint = new cc.PhysicsJointRotarySpring ( );
	Joint.init ( a, b, stiffness, damping );
	return Joint;	
};

/** Likes a limit joint, but works with rotary */
cc.PhysicsJointRotaryLimit = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, min, max )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.RotaryLimitJoint 
		( 
			this.getBodyInfo ( a ).getBody ( ), 
			this.getBodyInfo ( b ).getBody ( ),
			min,
			max
		);				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},

	getMin:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.min;
	},

	setMin:function ( min )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.min = min;		
	},	
	
	getMax:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.max;
	},

	setMax:function ( max )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.max = max;		
	},
});

cc.PhysicsJointRotaryLimit.create = function ( a, b, min, max )
{
	var		Joint = new cc.PhysicsJointRotaryLimit ( );
	Joint.init ( a, b, min, max );
	return Joint;	
};

/** Works like a socket wrench. */
cc.PhysicsJointRatchet = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, phase, ratchet )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.RatchetJoint 
		( 
			this.getBodyInfo ( a ).getBody ( ), 
			this.getBodyInfo ( b ).getBody ( ),
			phase,
			ratchet
		);				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},

	getAngle:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.angle;
	},

	setAngle:function ( angle )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.angle = angle;		
	},	
	
	getPhase:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.phase;
	},

	setPhase:function ( phase )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.phase = phase;		
	},	

	getRatchet:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.ratchet;
	},

	setRatchet:function ( ratchet )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.maxratchet = ratchet;		
	},
});

cc.PhysicsJointRatchet.create = function ( a, b, phase, ratchet )
{
	var		Joint = new cc.PhysicsJointRatchet ( );
	Joint.init ( a, b, phase, ratchet );
	return Joint;	
};

/** Keeps the angular velocity ratio of a pair of bodies constant. */
cc.PhysicsJointGear = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, phase, ratio )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.GearJoint 
		( 
			this.getBodyInfo ( a ).getBody ( ), 
			this.getBodyInfo ( b ).getBody ( ),
			phase,
			ratio
		);				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},

	getPhase:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.phase;
	},

	setPhase:function ( phase )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.min = phase;		
	},	

	getRatio:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.ratio;
	},

	setRatio:function ( ratio )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.ratio = ratio;		
	},
});

cc.PhysicsJointGear.create = function ( a, b, phase, ratio )
{
	var		Joint = new cc.PhysicsJointGear ( );
	Joint.init ( a, b, phase, ratio );
	return Joint;	
};

/** Keeps the relative angular velocity of a pair of bodies constant */
cc.PhysicsJointMotor = cc.PhysicsJoint.extend
({
	ctor:function ( )
	{
		this._super ( );
	},

	init:function ( a, b, rate )
	{
		cc.PhysicsJoint.prototype.init.call ( this, a, b );

		var 	joint = new cp.SimpleMotor 
		( 
			this.getBodyInfo ( a ).getBody ( ), 
			this.getBodyInfo ( b ).getBody ( ),
			rate
		);				
		if ( joint != null )
		{
			this._info.add ( joint );
			return true;
		}

		return false;
	},	

	getRate:function ( ) 
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		return joint.rate;
	},

	setRate:function ( rate )
	{
		var		joint = this._info.getJoints ( ) [ 0 ];
		joint.rate = rate;		
	},
});

cc.PhysicsJointMotor.create = function ( a, b, rate )
{
	var		Joint = new cc.PhysicsJointMotor ( );
	Joint.init ( a, b, rate );
	return Joint;	
};