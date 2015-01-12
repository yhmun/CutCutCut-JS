/** ----------------------------------------------------------------------------------
 *
 *      File            PolygonSprite.js
 *      Ported By       Young-Hwan Mun
 *      Contact         yh.msw9@gmail.com
 * 
 * -----------------------------------------------------------------------------------
 *   
 *      Created By              Allen Benson G Tan on 5/19/12 
 *      Copyright (c) 2012      WhiteWidget Inc. All rights reserved. 
 *
 * -----------------------------------------------------------------------------------
 * 
 *      Permission is hereby granted, free of charge, to any person obtaining a copy
 *      of this software and associated documentation files (the "Software"), to deal
 *      in the Software without restriction, including without limitation the rights
 *      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *      copies of the Software, and to permit persons to whom the Software is
 *      furnished to do so, subject to the following conditions:
 * 
 *      The above copyright notice and this permission notice shall be included in
 *      all copies or substantial portions of the Software.
 * 
 *      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *      THE SOFTWARE.
 *
 * ----------------------------------------------------------------------------------- */ 

cc.PolygonSpriteEx = cc.PolygonSprite.extend
({
	ctor:function ( )
	{
		this._super ( );		
		
		this.splurt 			= null;
		this.slice_entered 		= false;
		this.slice_exited  		= false;		
		this.entry_point		= cp.vzero;
		this.exit_point			= cp.vzero;
		this.slice_entry_time 	= 0;
		this.state 				= cc.PolygonSpriteEx.State.Idle; 
		this.type 				= -1;
	},
	
	initWithTexture:function ( texture, body, isOriginal )
	{
		if ( this._super ( texture, body, isOriginal ) == false )
		{
			return false;
		}
		
		this.slice_entered 		= false;
		this.slice_exited  		= false;
		this.entry_point		= cp.vzero;
		this.exit_point			= cp.vzero;
		this.slice_entry_time 	= 0;
		this.state 				= cc.PolygonSpriteEx.State.Idle; 
		
		return true;
	},
	
	getSliceEntered:function ( )
	{
		return this.slice_entered;
	},
	
	setSliceEntered:function ( slice_entered )
	{
		this.slice_entered = slice_entered;
	},
	
	getSliceExited:function ( )
	{
		return this.slice_exited;
	},
	
	setSliceExited:function ( slice_exited )
	{
		this.slice_exited = slice_exited;
	},
	
	getEntryPoint:function ( )
	{
		return this.entry_point;
	},
	
	setEntryPoint:function ( entry_point )
	{
		this.entry_point = entry_point;
	},

	getExitPoint:function ( )
	{
		return this.exit_point;
	},
	
	setExitPoint:function ( exit_point )
	{
		this.exit_point = exit_point;
	},		
	
	getState:function ( )
	{
		return this.state;
	},
	
	setState:function ( state )
	{
		this.state = state;
	},	

	getType:function ( )
	{
		return this.type;
	},
	
	setType:function ( type )
	{
		this.type = type;
	},	
	
	getSplurt:function ( )
	{
		return this.splurt;
	},
	
	setSplurt:function ( splurt )
	{
		this.splurt = splurt;
	},	
});

cc.PolygonSpriteEx.State =
{
	Idle			: 0	,
	Tossed			: 1 ,
};

cc.PolygonSpriteEx.Type =
{
	Watermelon		: 0	,
	Strawberry		: 1	,
	Pineapple		: 2	,
	Grapes			: 3	,
	Banana			: 4	,
	Bomb			: 5 ,
};