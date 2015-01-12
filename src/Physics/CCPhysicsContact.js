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

cc.PhysicsContactData = cc.Class.extend
({
	ctor:function ( )
	{		
		this.points = new Array ( cc.PhysicsContactData.POINT_MAX )
		this.count  = 0;
		this.normal = cp.vzero;	
	},
});

cc.PhysicsContactData.POINT_MAX = 4;

cc.PHYSICSCONTACT_EVENT_NAME = "PhysicsContactEvent";

cc.PhysicsContact = cc.Class.extend
({
	ctor:function ( a, b )
	{		
		this._world 			 = null;
		this._shapeA			 = null;
		this._shapeB			 = null;
		this._eventCode			 = cc.PhysicsContact.EventCode.NONE;
		this._info				 = null;
		this._notificationEnable = true;
		this._result			 = true;
		this._data				 = null;
		this._contactInfo		 = null;
		this._contactData		 = null;
		this._preContactData	 = null;
		
		this.init ( a, b );
	},
	
	init:function ( a, b )
	{
		if ( a == null || b == null )
		{
			return false;
		}
		
		this._info = new cc.PhysicsContactInfo ( this );		
		this._shapeA = a;
		this._shapeB = b;
		
		return true;
	},
	
	/** get contact shape A. */
	getShapeA:function ( )  
	{
		return this._shapeA; 
	},
	
	/** get contact shape B. */
	getShapeB:function ( ) 
	{
		return this._shapeB; 
	},

	/** get contact data */
	getContactData:function ( ) 
	{
		return this._contactData; 
	},

	/** get previous contact data */
	getPreContactData:function ( ) 
	{
		return this._preContactData; 
	},
	
	/** get data. */
	getData:function ( ) 
	{
		return this._data; 
	},
	
	/**
	 * @brief set data to contact. you must manage the memory yourself, Generally you can set data at contact begin, and distory it at contact seperate.
	 */
	setData:function ( data ) 
	{
		this._data = data; 
	},
	
	/** get the event code */
	getEventCode:function ( ) 
	{
		return this._eventCode; 
	},	

	setEventCode:function ( eventCode )
	{
		this._eventCode = eventCode; 
	},
	
	isNotificationEnabled:function ( ) 
	{
		return this._notificationEnable; 
	},
	
	setNotificationEnable:function ( enable )
	{ 
		this._notificationEnable = enable; 
	},

	getWorld:function ( ) 
	{
		return this._world; 
	},

	setWorld:function ( world )
	{
		this._world = world; 
	},

	setResult:function ( result )
	{
		this._result = result;
	},

	resetResult:function ( )
	{
		var 	ret = this._result;
		this._result = true; 
		return ret; 
	},

	generateContactData:function ( )
	{
		if ( this._contactInfo == null )
		{
			return;
		}

		var 	arb = this._contactInfo;		
		
		this._preContactData = this._contactData;
		this._contactData = new cc.PhysicsContactData ( );
		this._contactData.count = cc.sys.isNative ? arb.getCount ( ) : arb.contacts.length;	
		
		for ( var i = 0; i < this._contactData.count && i < cc.PhysicsContactData.POINT_MAX; ++i )
		{
			this._contactData.points [ i ] = arb.getPoint ( i );
		}

		this._contactData.normal = this._contactData.count > 0 ? arb.getNormal ( 0 ) : cp.vzero;				
	},
});

cc.PhysicsContact.EventCode =
{
	NONE 		: 0,
	BEGIN 		: 1,
	PRESOLVE 	: 2,
	POSTSOLVE 	: 3,
	SEPERATE 	: 4
};

/*
 * @brief presolve value generated when onContactPreSolve called.
 */
cc.PhysicsContactPreSolve = cc.Class.extend
({
	ctor:function ( contactInfo )
	{
		this._contactInfo = contactInfo;
	},
	
	/** get restitution between two bodies*/
	getRestitution:function ( ) 
	{
		return this._contactInfo.e;
	},
	
	/** get friction between two bodies*/
	getFriction:function ( )
	{
		return this._contactInfo.u;
	},
	
	/** get surface velocity between two bodies*/
	getSurfaceVelocity:function ( )
	{
		return this._contactInfo.surface_vr;
	},
	
	/** set the restitution*/
	setRestitution:function ( restitution )
	{
		this._contactInfo.e = restitution;
	},
	
	/** set the friction*/
	setFriction:function ( friction )
	{
		this._contactInfo.u = friction;
	},
	
	/** set the surface velocity*/
	setSurfaceVelocity:function ( velocity )
	{
		this._contactInfo.surface_vr = velocity;		
	},
	
	/** ignore the rest of the contact presolve and postsolve callbacks */
	ignore:function ( )
	{
		this._contactInfo.ignore ( );
	},
});

/*
 * @brief postsolve value generated when onContactPostSolve called.
 */
cc.PhysicsContactPostSolve = cc.Class.extend
({
	ctor:function ( contactInfo )
	{
		this._contactInfo = contactInfo;
	},
	
	/** get restitution between two bodies*/
	getRestitution:function ( ) 
	{
		return this._contactInfo.e;
	},
	
	/** get friction between two bodies*/
	getFriction:function ( ) 
	{
		return this._contactInfo.u;
	},
	
	/** get surface velocity between two bodies*/
	getSurfaceVelocity:function ( ) 
	{
		return this._contactInfo.surface_vr.x;
	},
});

/* contact listener. it will recive all the contact callbacks. */

cc.EventListenerPhysicsContact = cc.Class.extend //cc.EventListener.extend //public EventListenerCustom
({
	ctor:function ( )
	{		
		this.onContactBegin 	= null;
		this.onContactPreSolve 	= null;
		this.onContactPostSolve = null;
		this.onContactSeperate	= null;
	},
	
	checkAvailable:function ( )
	{
		if ( this.onContactBegin == null && this.onContactPreSolve == null && this.onContactPostSolve == null && this.onContactSeperate == null )
		{
			cc.assert ( false, "Invalid PhysicsContactListener." );
			return false;
		}

		return true;
	},
	
	clone:function ( )
	{
		var 	obj = new cc.EventListenerPhysicsContact ( );

		obj.onContactBegin 		= this.onContactBegin;
		obj.onContactPreSolve 	= this.onContactPreSolve;
		obj.onContactPostSolve 	= this.onContactPostSolve;
		obj.onContactSeperate 	= this.onContactSeperate;

		return obj;
	},
	
	/**
	 * it will be call when two body have contact.
	 * if return false, it will not invoke callbacks
	 */
	hitTest:function ( shapeA, shapeB )
	{
		return true;
	},
	
	onEvent:function ( event )
	{		
		var 	contact = event.getUserData ( );

		if ( contact == null )
		{
			return;
		}

		switch ( contact.getEventCode ( ) )
		{		
			case cc.PhysicsContact.EventCode.BEGIN :
			{
					var 	ret = true;
		
					if ( this.onContactBegin != null && this.hitTest ( contact.getShapeA ( ), contact.getShapeB ( ) ) )
					{
						contact.generateContactData ( );
						ret = this.onContactBegin ( contact );
					}
		
					contact.setResult ( ret );
					break;
				}
				
			case cc.PhysicsContact.EventCode.PRESOLVE :
				{
					var 	ret = true;
		
					if ( this.onContactPreSolve != null && this.hitTest ( contact.getShapeA ( ), contact.getShapeB ( ) ) )
					{
						var		solve = new cc.PhysicsContactPreSolve ( contact._contactInfo );
						contact.generateContactData ( );	
						ret = this.onContactPreSolve ( contact, solve );
					}
		
					contact.setResult ( ret );
					break;
				}
				
				case cc.PhysicsContact.EventCode.POSTSOLVE :
				{
					if ( this.onContactPostSolve != null && this.hitTest ( contact.getShapeA ( ), contact.getShapeB ( ) ) )
					{
						var		solve = new cc.PhysicsContactPostSolve ( contact._contactInfo );					
						this.onContactPostSolve ( contact, solve );
					}
					break;
				}
				
				case cc.PhysicsContact.EventCode.SEPERATE :
				{
					if ( this.onContactSeperate != null && this.hitTest ( contact.getShapeA ( ), contact.getShapeB ( ) ) )
					{
						this.onContactSeperate ( contact );
					}
					break;
				}
		}
	},
});

/** this event listener only be called when bodyA and bodyB have contacts */
cc.EventListenerPhysicsContactWithBodies = cc.EventListenerPhysicsContact.extend 
({
	ctor:function ( bodyA, bodyB )
	{
		this._super ( );
		
		this._a = bodyA;
		this._b = bodyB;
	},
	
	hitTest:function ( shapeA, shapeB )
	{
		if ( ( shapeA.getBody ( ) == this._a && shapeB.getBody ( ) == this._b ) ||
			 ( shapeA.getBody ( ) == this._b && shapeB.getBody ( ) == this._a ) )
		{
			return true;
		}

		return false;
	},
	
	clone:function ( )
	{
		var 	obj = new cc.EventListenerPhysicsContactWithBodies ( this._a, this._b );

		obj.onContactBegin 		= this.onContactBegin;
		obj.onContactPreSolve 	= this.onContactPreSolve;
		obj.onContactPostSolve 	= this.onContactPostSolve;
		obj.onContactSeperate 	= this.onContactSeperate;

		return obj;
	},
});

/** this event listener only be called when shapeA and shapeB have contacts */
cc.EventListenerPhysicsContactWithShapes = cc.EventListenerPhysicsContact.extend 
({
	ctor:function ( shapeA, shapeB )
	{
		this._super ( );
		
		this._a = shapeA;
		this._b = shapeB;
	},
	
	hitTest:function ( shapeA, shapeB )
	{
		if ( ( shapeA == this._a && shapeB == this._b ) ||
			 ( shapeA == this._b && shapeB == this._a ) )
		{
			return true;
		}

		return false;
	},

	clone:function ( )
	{
		var 	obj = new cc.EventListenerPhysicsContactWithShapes ( this._a, this._b );
		
		obj.onContactBegin 		= this.onContactBegin;
		obj.onContactPreSolve 	= this.onContactPreSolve;
		obj.onContactPostSolve 	= this.onContactPostSolve;
		obj.onContactSeperate 	= this.onContactSeperate;

		return obj;
	},
});

/** this event listener only be called when shapeA or shapeB is in the group your specified */

cc.EventListenerPhysicsContactWithGroup = cc.EventListenerPhysicsContact.extend 
({
	ctor:function ( group )
	{
		this._super ( );
		
		this._group = group;
	},
	
	hitTest:function ( shapeA, shapeB )
	{
		if ( shapeA.getGroup ( ) == this._group || shapeB.getGroup ( ) == this._group ) 
		{
			return true;
		}

		return false;
	},

	clone:function ( )
	{
		var 	obj = new cc.EventListenerPhysicsContactWithGroup ( this._group );

		obj.onContactBegin 		= this.onContactBegin;
		obj.onContactPreSolve 	= this.onContactPreSolve;
		obj.onContactPostSolve 	= this.onContactPostSolve;
		obj.onContactSeperate 	= this.onContactSeperate;

		return obj;
	},
});