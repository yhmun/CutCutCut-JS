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

cc.PhysicsWorldInfo = cc.Class.extend
({
	ctor:function ( )
	{		
		this._space = new cp.Space ( );
	},

	getSpace:function ( ) 
	{
		return this._space; 
	},

	addShape:function ( shape )
	{
		var		shapes = shape.getShapes ( );
		for ( var idx in shapes )
		{
			var		cps = shapes [ idx ];
			this._space.addShape ( cps );
		}
	},
	
	removeShape:function ( shape )
	{
		var		shapes = shape.getShapes ( );
		for ( var idx in shapes )
		{
			var		cps = shapes [ idx ];
			if ( this._space.containsShape ( cps ) )
			{
				this._space.removeShape ( cps );
			}
		}
	},
	
	addBody:function ( body )
	{		
		if ( !this._space.containsBody ( body.getBody ( ) ) )
		{
			this._space.addBody ( body.getBody ( ) );		
		}		
	},
	
	removeBody:function ( body )
	{		
		if ( this._space.containsBody ( body.getBody ( ) ) )
		{
			this._space.removeBody ( body.getBody ( ) );
		}	
	},
	
	addJoint:function ( joint )
	{
		var		joints = joint.getJoints ( );
		for ( var idx in joints )
		{
			var		subjoint = joints [ idx ];
			this._space.addConstraint ( subjoint );
		}
	},
	
	removeJoint:function ( joint )
	{
		var		joints = joint.getJoints ( );
		for ( var idx in joints )
		{
			var		subjoint = joints [ idx ];
			this._space.removeConstraint ( subjoint );
		}
	},
	
	setGravity:function ( gravity )
	{
		this._space.gravity = gravity;		
	},
	
	isLocked:function ( )
	{		
		return this._space.isLocked ( );
	},
	
	step:function ( delta )
	{
		this._space.step ( delta );		
	},
});
