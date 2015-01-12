/** ----------------------------------------------------------------------------------
 *
 *      File            CCBlade.js
 *      Ported By       Young-Hwan Mun
 *      Contact         yh.msw9@gmail.com
 * 
 * -----------------------------------------------------------------------------------
 *   
 *      Copyright (c) 2011 - Ngo Duc Hiep  
 *      Copyright (c) 2014 - ChildhoodAndy 
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

cc.USE_LAGRANGE = true;
cc.USE_STL_LIST	= 0;
cc.EPSILON 		= 0.00001;

cc.DEFAULT_BLADE_WIDTH = 5.0;
cc.DISTANCE_TO_INTERPOLATE = 10;

cc.Blade = cc.GLNode.extend
({
	ctor:function ( limit )
	{
		this._super ( );
		
		this._bladeWidth	= cc.DEFAULT_BLADE_WIDTH;
		this._reset			= false;
		this._autoDim 		= false;
		this._texture 		= null;
		this._path			= new Array ( );
		this._count			= 0;
		this._finish		= false;
		this._willPop		= false;		
		this._pointLimit	= 0;
		this._vertices		= null;
		this._coordinates	= null;	
		
		this._vertex_buffer	= null;
		this._coord_buffer	= null;			
		
		if ( !( limit === undefined ) )
		{
			this.initWithMaximumPoint ( limit );	
		}			
	},
	
	initWithMaximumPoint:function ( limit )
	{
		this.Shader = cc.shaderCache.getProgram ( "ShaderPositionTexture" );
		
		this._pointLimit 	= limit;
		this._vertices   	= new Array ( 2 * ( 2 * this._pointLimit + 5 ) );
		this._coordinates 	= new Array ( 2 * ( 2 * this._pointLimit + 5 ) );
		
		this._coordinates [ 0 ] = 0;
		this._coordinates [ 1 ] = 0.5;		
		
		this._vertex_buffer = gl.createBuffer ( );		
		this._coord_buffer  = gl.createBuffer ( );		
	},
	
	setBladeWidth:function ( bladeWidth )
	{
		this._bladeWidth = bladeWidth;
	},
	
	getPath:function ( ) 
	{
		return this._path;
	},
	
	pop:function ( n )
	{
		while ( this._path.length > 0 && n > 0 )
		{
			this._path.pop ( );
			n--;
		}

		if ( this._path.length > 2 )
		{
			this.populateVertices ( );
		}
	},
	
	populateVertices:function ( )
	{
		this._vertices [ 0 ] = this._path [ 0 ].x;
		this._vertices [ 1 ] = this._path [ 0 ].y;
		
		var		pre = cp.v ( this._vertices [ 0 ], this._vertices [ 1 ] );
		var 	i   = 0;
		var 	it  = this._path [ 1 ];
		var 	dd  = this._bladeWidth / this._path.length;
		
		while ( i < this._path.length - 2 )
		{
			var		out = this.f1 ( pre, it, this._bladeWidth - i * dd ); 
			
			this._vertices [ ( 2 * i + 1 ) * 2 + 0 ] = out.o1.x;
			this._vertices [ ( 2 * i + 1 ) * 2 + 1 ] = out.o1.y;
			
			this._vertices [ ( 2 * i + 2 ) * 2 + 0 ] = out.o2.x;
			this._vertices [ ( 2 * i + 2 ) * 2 + 1 ] = out.o2.y;
			
			this._coordinates [ ( 2 * i + 1 ) * 2 + 0 ] = 0.5;
			this._coordinates [ ( 2 * i + 1 ) * 2 + 1 ] = 1.0;
			
			this._coordinates [ ( 2 * i + 2 ) * 2 + 0 ] = 0.5;
			this._coordinates [ ( 2 * i + 2 ) * 2 + 1 ] = 0.0;

			i++;
			pre = it;

			it = this._path [ i + 1 ];
		}

		this._coordinates [ 1 * 2 + 0 ] = 0.25;
		this._coordinates [ 1 * 2 + 1 ] = 1.0;
		
		this._coordinates [ 2 * 2 + 0 ] = 0.25;
		this._coordinates [ 2 * 2 + 1 ] = 1.0;

		this._vertices [ ( 2 * this._path.length - 3 ) * 2 + 0 ] = it.x;
		this._vertices [ ( 2 * this._path.length - 3 ) * 2 + 1 ] = it.y;
		
		this._coordinates [ ( 2 * this._path.length - 3 ) * 2 + 0 ] = 0.75;
		this._coordinates [ ( 2 * this._path.length - 3 ) * 2 + 1 ] = 0.5;	
		
		gl.bindBuffer ( gl.ARRAY_BUFFER, this._vertex_buffer );
		gl.bufferData ( gl.ARRAY_BUFFER, new Float32Array ( this._vertices ), gl.STATIC_DRAW );
		
		gl.bindBuffer ( gl.ARRAY_BUFFER, this._coord_buffer );
		gl.bufferData ( gl.ARRAY_BUFFER, new Float32Array ( this._coordinates ), gl.STATIC_DRAW );
		
		gl.bindBuffer ( gl.ARRAY_BUFFER, null );		
	},
	
	push:function ( point )
	{		
		this._willPop = false;

		if ( this._reset )
		{
			return;
		}
		
		if ( cc.director.getContentScaleFactor ( ) != 1.0 )
		{
			point = cp.v.mult ( point, cc.director.getContentScaleFactor ( ) );
		}

		if ( cc.USE_LAGRANGE )
		{
			if ( this._path.length == 0 )
			{
				this._path.push ( point );
				return;
			}
	
			var 	first = this._path [ 0 ];
			
			if ( cp.v.dist ( point, first ) < cc.DISTANCE_TO_INTERPOLATE )
			{
				this._path.splice ( 0, 0, point );
				if ( this._path.length > this._pointLimit )
				{
					this._path.pop ( );
				}
			}
			else
			{
				var 	num = cp.v.dist ( point, first ) / cc.DISTANCE_TO_INTERPOLATE;
				var 	iv  = cp.v.mult ( cp.v.sub ( point, first ), 1.0 / ( num + 1 ) );
				for ( var i = 1; i <= num + 1; i++ )
				{
					this._path.splice ( 0, 0, cp.v.add ( first, cp.v.mult ( iv, i ) ) );									
				}
				while ( this._path.length > this._pointLimit )
				{
					this._path.pop ( );
				}
			}
		}
		else 
		{
			this._path.splice ( 0, 0, point );
			if ( this._path.length > this._pointLimit )
			{
				this._path.pop ( );				
			}
		}

		this.populateVertices ( );		
	},
	
	clear:function ( )
	{
		this._path.splice ( 0, this._path.length );		
		this._reset = false;
		if ( this._finish )
		{
			this.removeFromParent ( true );
		}
	},
	
	rotateByAngle:function ( point, pivot, angle )
	{
		return cp.v.add ( pivot, cp.v.rotate ( cp.v.sub ( point, pivot ), cp.v ( Math.cos ( angle ), Math.sin ( angle ) ) ) );
	},
	
	fangle:function ( point )
	{
		if ( point.x <= cc.EPSILON && point.x >= -cc.EPSILON && point.y <= cc.EPSILON && point.y >= -cc.EPSILON )
		{
			return 0;
		}
	
		if ( point.x <= cc.EPSILON && point.x >= -cc.EPSILON )
		{
			return point.y > 0 ? Math.PI / 2 : -Math.PI / 2;
		}
	
		if ( point.y <= cc.EPSILON && point.y >= -cc.EPSILON && point.x < 0 )
		{
			return -Math.PI;
		}
	
		var 	angle = Math.atan ( point.y / point.x );	
		return point.x < 0 ? angle + Math.PI : angle;
	},

	f1:function ( p1, p2, d )
	{
		
		var 	l = cp.v.dist ( p1, p2 );
		var 	angle = this.fangle ( cp.v.sub ( p2, p1 ) );
		
		return {
			o1: this.rotateByAngle ( cp.v.add ( p1, cp.v ( l,  d ) ), p1, angle ),
			o2: this.rotateByAngle ( cp.v.add ( p1, cp.v ( l, -d ) ), p1, angle )
		};
	},

	reset:function ( ) 
	{
		this._reset = true; 
	},
	
	setDim:function ( dim )
	{
		this._reset = dim; 
	},
	
	finish:function ( ) 
	{
		this._finish = true; 
	},
	
	getAutoDim:function ( )
	{
		return this._autoDim;
	},
	
	setAutoDim:function ( autoDim )
	{
		this._autoDim = autoDim;
	},
	
	getTexture:function ( )
	{
		return this._texture;
	},

	setTexture:function ( texture )
	{
		this._texture = texture;
	},	
	
	getPointLimit:function ( )
	{
		return this._pointLimit;
	},

	setPointLimit:function ( pointLimit )
	{
		this._pointLimit = pointLimit;
	},		
	
	draw:function ( )
	{
		if ( ( this._reset && this._path.length > 0 ) || ( this._autoDim && this._willPop ) )
		{
			this.pop ( 1 );
			if ( this._path.length < 3 )
			{
				this.clear ( );
			}
		}

		if ( this._path.length < 3 )
		{
			return;
		}

		this._willPop = true;
		
		this.Shader.use ( );
		this.Shader.setUniformsForBuiltins ( );

		gl.bindTexture ( gl.TEXTURE_2D, this._texture.getName ( ) );		
		//gl.blendFunc ( this.BlendFunc.src, this.BlendFunc.dst );

		cc.glEnableVertexAttribs ( cc.VERTEX_ATTRIB_FLAG_TEX_COORDS | cc.VERTEX_ATTRIB_FLAG_POSITION );

		// Draw fullscreen Square
		gl.bindBuffer ( gl.ARRAY_BUFFER, this._vertex_buffer );
		gl.vertexAttribPointer ( cc.VERTEX_ATTRIB_POSITION, 2, gl.FLOAT, false, 0, 0 );

		gl.bindBuffer ( gl.ARRAY_BUFFER, this._coord_buffer );
		gl.vertexAttribPointer ( cc.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, 0, 0 );		

		gl.drawArrays ( gl.TRIANGLE_STRIP, 0, 2 * this._path.length - 2 );

		gl.bindTexture ( gl.TEXTURE_2D  , null );
		gl.bindBuffer  ( gl.ARRAY_BUFFER, null );
	},
});

