/** ----------------------------------------------------------------------------------
 *
 *      File            PRFilledPolygon.js
 *      Description     This class fills a polygon as described by an array of
 *                      NSValue-encapsulated points with a texture.
 *      Ported By       Young-Hwan Mun
 *      Contact         yh.msw9@gmail.com
 * 
 * -----------------------------------------------------------------------------------
 *   
 *      Copyright (c) 2011      Damiano Mazzella ( Translated in C++ for Cocos2d-X on 19/03/2012 )
 *      Copyright (c) 2011      Precognitive Research, LLC. All rights reserved. ( Created by Andy Sinesio on 6/25/10 )
 *
 *         http://precognitiveresearch.com      
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

cc.PRFilledPolygon = cc.GLNode.extend
({
	ctor:function ( )
	{
		this._super ( );	

		this.Points			= new Array ( );			
		this.Texture		= null;
		this.BlendFunc		= null; 
		this.VertexBuffer	= null;
		this.TexCoordBuffer	= null;		
	},

	initWithPoints:function ( Points, Texture )
	{
		this.Shader = cc.shaderCache.getProgram ( "ShaderPositionTexture" );

		this.setTexture ( Texture );
		this.setPoints ( Points );		

		return true;
	},

	setTexture:function ( Texture )
	{
		this.Texture = Texture;

		gl.bindTexture ( gl.TEXTURE_2D, this.Texture.getName ( ) );	

		gl.texParameteri ( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
		gl.texParameteri ( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
		gl.texParameteri ( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
		gl.texParameteri ( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );

		this.updateBlendFunc ( );
		this.calculateTextureCoordinates ( );
	},

	getTexture:function ( )
	{
		return this.Texture;
	},

	setPoints:function ( Points )
	{				
		var		Verts = null;
		if ( (typeof Points [ 0 ]) == "object" )
		{
			Verts = new Array ( );
			for ( var i = 0; i < Points.length; i++ )
			{
				Verts.push ( Points [ i ].x );
				Verts.push ( Points [ i ].y );				
			}	
		}
		else
		{
			Verts = Points;
		}
		
		this.Points.splice ( 0, this.Points.length );		
		cc.Triangulate.Process ( Verts, this.Points );	

		if ( this.VertexBuffer != null )
		{
			gl.deleteBuffer ( this.VertexBuffer );
		}
		this.VertexBuffer = gl.createBuffer ( );		
		gl.bindBuffer ( gl.ARRAY_BUFFER, this.VertexBuffer );
		gl.bufferData ( gl.ARRAY_BUFFER, new Float32Array ( this.Points ), gl.STATIC_DRAW );
		gl.bindBuffer ( gl.ARRAY_BUFFER, null );

		this.calculateTextureCoordinates ( );
	},	

	calculateTextureCoordinates:function ( )
	{
		if ( this.Points.length == 0 )
		{
			return;	
		}

		var		TexCoords = new Array ( this.Points.length );
		for ( var i = 0; i < this.Points.length / 2; i++ )
		{
			var		offset = i * 2;
			
			TexCoords [ offset + 0 ] = this.Points [ offset + 0 ] * 1.0 / this.Texture.getPixelsWide ( ) * cc.director.getContentScaleFactor ( );
			TexCoords [ offset + 1 ] = this.Points [ offset + 1 ] * 1.0 / this.Texture.getPixelsHigh ( ) * cc.director.getContentScaleFactor ( );			
			TexCoords [ offset + 1 ] = 1.0 - TexCoords [ offset + 1 ];
		}		

		if ( this.TexCoordBuffer != null )
		{
			gl.deleteBuffer ( this.TexCoordBuffer );
		}
		this.TexCoordBuffer = gl.createBuffer ( );		
		gl.bindBuffer ( gl.ARRAY_BUFFER, this.TexCoordBuffer );
		gl.bufferData ( gl.ARRAY_BUFFER, new Float32Array ( TexCoords ), gl.STATIC_DRAW );
		gl.bindBuffer ( gl.ARRAY_BUFFER, null );
	},

	updateBlendFunc:function ( )
	{
		if( !this.Texture || !this.Texture.hasPremultipliedAlpha ( ) ) 
		{
			this.BlendFunc = 
			{
				src : cc.SRC_ALPHA,
				dst : cc.ONE_MINUS_SRC_ALPHA
			};					
		}
		else 
		{
			this.BlendFunc = 
			{
				src : cc.BLEND_SRC,
				dst : cc.BLEND_DST
			};			
		}	    
	},

	setBlendFunc:function ( BlendFunc )
	{
		this.BlendFunc.src = BlendFunc.src;
		this.BlendFunc.dst = BlendFunc.dst;
	},

	draw:function ( )
	{			
		if ( this.Points.length <= 2 )
		{
			return;
		}
		
		this.Shader.use ( );
		this.Shader.setUniformsForBuiltins ( );
	
		gl.bindTexture ( gl.TEXTURE_2D, this.Texture.getName ( ) );		
		gl.blendFunc ( this.BlendFunc.src, this.BlendFunc.dst );

		cc.glEnableVertexAttribs ( cc.VERTEX_ATTRIB_FLAG_TEX_COORDS | cc.VERTEX_ATTRIB_FLAG_POSITION );

		// Draw fullscreen Square
		gl.bindBuffer ( gl.ARRAY_BUFFER, this.VertexBuffer );
		gl.vertexAttribPointer ( cc.VERTEX_ATTRIB_POSITION, 2, gl.FLOAT, false, 0, 0 );

		gl.bindBuffer ( gl.ARRAY_BUFFER, this.TexCoordBuffer );
		gl.vertexAttribPointer ( cc.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, 0, 0 );		
		
		gl.drawArrays ( gl.TRIANGLES, 0, this.Points.length / 2 );

		gl.bindTexture ( gl.TEXTURE_2D  , null );
		gl.bindBuffer  ( gl.ARRAY_BUFFER, null );
	},
});