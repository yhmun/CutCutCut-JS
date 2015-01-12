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

cp.Shape.prototype.userdata = null;

cc.PhysicsShapeInfo = cc.Class.extend
({
	_sharedBody : null,

	ctor:function ( shape )
	{
		if ( cc.PhysicsShapeInfo._sharedBody == null )
		{
			cc.PhysicsShapeInfo._sharedBody = new cp.Body ( Infinity, Infinity );
			cc.PhysicsShapeInfo._sharedBody.nodeIdleTime = Infinity;
		}
		
		this._shapes = new Array ( );
		this._shape  = shape;
		this._body 	 = cc.PhysicsShapeInfo._sharedBody;
		this._group  = cp.NO_GROUP;
	},

	add:function ( shape )
	{
		if ( shape == null )		
		{
			return;
		}
		
		shape.group = this._group;
		this._shapes.push ( shape );		
		shape.userdata = this;
	},
	
	remove:function ( shape )
	{
		if ( shape == null )		
		{
			return;
		}
		
		var		idx = this._shapes.indexOf ( shape );
		if ( idx != -1 )
		{
			this._shapes.splice ( idx, 1 );
			delete shape;
		}
	},
	
	removeAll:function ( )
	{
		while ( this._shapes.length > 0 )
		{
			var		shape = this._shapes [ 0 ];
			this._shapes.splice ( 0, 1 );
			delete shape;
		}
	},
	
	setGroup:function ( group )
	{
		this._group = group;
		
		for ( var idx in this._shapes )
		{
			var		shape = this._shapes [ idx ];
			shape.group = group;
		}			
	},
	
	setBody:function ( body )
	{
		if ( this._body != body )
		{
			this._body = body;
			for ( var idx in this._shapes )
			{
				var		shape = this._shapes [ idx ];
				shape.setBody ( body == null ? cc.PhysicsShapeInfo._sharedBody : body );							
			}
		}
	},

	getShape:function ( )
	{		
		return this._shape;
	},
	
	getShapes:function ( ) 
	{ 
		return this._shapes; 
	},
	
	getBody:function ( )
	{ 
		return this._body;
	},
	
	getGourp:function ( ) 
	{
		return this._group; 
	},
	
	getSharedBody:function ( )
	{
		return cc.PhysicsShapeInfo._sharedBody;
	},
});

cc.PhysicsShapeInfo.getSharedBody = function ( )
{
	return cc.PhysicsShapeInfo._sharedBody;
};
