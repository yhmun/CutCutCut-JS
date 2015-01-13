/** ----------------------------------------------------------------------------------
 *
 *      File            PolygonSprite.js
 *      Ported By       Young-Hwan Mun
 *      Contact         yh.msw9@gmail.com
 * 
 * -----------------------------------------------------------------------------------
 *   
 *      Created By              Hanno Bruns on 24.06.12
 *      Copyright (c) 2012      zeiteisens. All rights reserved.  
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

cc.PolygonSprite = cc.PRFilledPolygon.extend
({
	ctor:function ( )
	{
		this._super ( );
		
		this.body = null;
		this.isOriginal = false;
		this.centroid = cp.vzero;
	},

	initWithFile:function ( fileName, body, isOriginal )
	{
		var		texture = cc.textureCache.addImage ( fileName );		
		return this.initWithTexture ( texture, body, isOriginal );
	},

	initWithTexture:function ( texture, body, isOriginal )
	{
		var		shape  = body.getFirstShape ( );		
		var		count  = shape.getPointsCount ( );
		var		points = new Array ( ); 
		
		for ( var i = 0; i < count; i++ )
		{
			var 	pos = body.local2World ( shape.getPoint ( i ) );			
			points.push ( pos );
		}
				
		this.initWithPoints ( points, texture );

		this.isOriginal = isOriginal;
		this.centroid = cc.PhysicsShape.getPolyonCenter ( points ); 

		this.setAnchorPoint ( cp.v ( this.centroid.x / texture.getContentSize ( ).width, this.centroid.y / texture.getContentSize ( ).height ) );
		this.setPhysicsBody ( body );
		
		return true;
	},
	
	activateCollisions:function ( )
	{
//		this.getPhysicsBody ( ).setCategoryBitmask  ( 0x0001 );
//		this.getPhysicsBody ( ).setCollisionBitmask ( 0x0001 );
	},
	
	deactivateCollisions:function ( )
	{
		this.getPhysicsBody ( ).setCategoryBitmask  ( 0 );
		this.getPhysicsBody ( ).setCollisionBitmask ( 0 );
	},

	//setPosition:function ( Position )
	//{
		
	//},

	//nodeToParentTransform:function ( )
//	{
		
//	},
	
	
});
