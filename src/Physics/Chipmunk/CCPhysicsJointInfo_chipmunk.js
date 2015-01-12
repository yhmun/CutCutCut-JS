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

cc.PhysicsJointInfo = cc.Class.extend
({
	_map : null,
	
	ctor:function ( joint )
	{
		if ( cc.PhysicsJointInfo._map == null )
		{
			cc.PhysicsJointInfo._map = new Array ( );
		}
		
		this._joint = joint;
		this._joints = new Array ( );
	},

	add:function ( joint )
	{
		if ( joint == null )		
		{
			return;
		}
		
		this._joints.push ( joint );		
		cc.PhysicsJointInfo._map.push ( { key:joint, value:this } );
	},
	
	remove:function ( joint )
	{
		if ( joint == null )		
		{
			return;
		}

		var		idx = this._joints.indexOf ( joint );
		if ( idx != -1 )
		{
			this._joints.splice ( idx, 1 );

			for ( var i = 0; i < cc.PhysicsJointInfo._map.length; i++ )
			{
				var		key = cc.PhysicsJointInfo._map [ i ].key;
				if ( key == joint )
				{
					cc.PhysicsJointInfo._map.splice ( i, 1 );
					break;
				}
			}

			delete joint;
		}
	},
	
	removeAll:function ( )
	{
		while ( this._joints.length > 0 )
		{
			var		joint = this._joints [ 0 ];
			this._joints.splice ( 0, 1 );

			for ( var i = 0; i < cc.PhysicsJointInfo._map.length; i++ )
			{
				var		key = cc.PhysicsJointInfo._map [ i ].key;
				if ( key == joint )
				{
					cc.PhysicsJointInfo._map.splice ( i, 1 );
					break;
				}
			}			

			delete joint;
		}
	},
	
	getJoint:function ( ) 
	{
		return this._joint;
	},
	
	getJoints:function ( ) 
	{
		return this._joints; 
	},	
});

cc.PhysicsJointInfo.getMap = function ( )
{
	return cc.PhysicsJointInfo._map;
};
