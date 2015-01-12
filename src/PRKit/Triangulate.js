/** ----------------------------------------------------------------------------------
 *
 *      File            Triangulate.js
 *      Description     This class fills a polygon as described by an array of 
 *                      NSValue-encapsulated points with a texture.
 *      Ported By       Young-Hwan Mun
 *      Contact         yh.msw9@gmail.com
 * 
 * -----------------------------------------------------------------------------------
 *   
 *      Created By      Andy Sinesio on 6/25/10.
 *      
 *      Copyright (c) 2011      Precognitive Research, LLC. All rights reserved.
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

cc.EPSILON = 0.0000000001;

cc.Triangulate = 
{
		// compute area of a contour/polygon
		Area:function ( Contours )
		{	
			var		n = Contours.length / 2;
			var		A = 0.0;

			for ( var p = n - 1, q = 0; q < n; p = q++ )
			{
				A += Contours [ p * 2 + 0 ] * Contours [ q * 2 + 1 ] - Contours [ q * 2 + 0 ] * Contours [ p * 2 + 1 ];
			}

			return A * 0.5;
		},

		//
		// InsideTriangle decides if a point P is Inside of the triangle
		// defined by A, B, C.
		//
		InsideTriangle:function  ( Ax, Ay, Bx, By, Cx, Cy, Px, Py )
		{
			var		ax, ay, bx, by, cx, cy, apx, apy, bpx, bpy, cpx, cpy;
			var		cCROSSap, bCROSScp, aCROSSbp;

			ax  = Cx - Bx;  ay  = Cy - By;
			bx  = Ax - Cx;  by  = Ay - Cy;
			cx  = Bx - Ax;  cy  = By - Ay;
			apx = Px - Ax;  apy = Py - Ay;
			bpx = Px - Bx;  bpy = Py - By;
			cpx = Px - Cx;  cpy = Py - Cy;

			aCROSSbp = ax * bpy - ay * bpx;
			cCROSSap = cx * apy - cy * apx;
			bCROSScp = bx * cpy - by * cpx;
			
			return ( ( aCROSSbp >= 0.0 ) && ( bCROSScp >= 0.0 ) && ( cCROSSap >= 0.0 ) );
		},

		Snip:function ( Contours, u, v, w, n, V )
		{
			var		p;
			var		Ax, Ay, Bx, By, Cx, Cy, Px, Py;

			Ax = Contours [ V[u] * 2 + 0 ];
			Ay = Contours [ V[u] * 2 + 1 ];

			Bx = Contours [ V[v] * 2 + 0 ];
			By = Contours [ V[v] * 2 + 1 ];

			Cx = Contours [ V[w] * 2 + 0 ];
			Cy = Contours [ V[w] * 2 + 1 ];

			if ( cc.EPSILON > ( ( ( Bx - Ax ) * ( Cy - Ay ) ) - ( ( By - Ay ) * ( Cx - Ax ) ) ) ) 
			{
				return false;
			}

			for ( p = 0; p < n; p++ )
			{
				if ( ( p == u ) || ( p == v ) || ( p == w ) )
				{
					continue;
				}

				Px = Contours [ V[p] * 2 + 0 ];
				Py = Contours [ V[p] * 2 + 1 ];
	
				if ( cc.Triangulate.InsideTriangle ( Ax, Ay, Bx, By, Cx, Cy, Px, Py ) )
				{
					return false;
				}
			}

			return true;
		},

		// triangulate a contour/polygon, places results in STL vector
		// as series of triangles.
		Process:function ( Contours, Results )
		{
			// allocate and initialize list of Vertices in polygon 	
			var		n = Contours.length / 2;

			var		V = new Array ( n );

			if ( n < 3 ) 
			{
				return false;
			}

			// we want a counter-clockwise polygon in V 	
			if ( 0.0 < cc.Triangulate.Area ( Contours ) )
			{
				for ( var v = 0; v < n; v++ )
				{
					V[v] = v;
				}
			}
			else
			{
				for ( var v = 0; v < n; v++ )
				{
					V[v] = ( n - 1 ) - v;
				}
			}

			var		nv = n;

			//  remove nv-2 Vertices, creating 1 triangle every time 
			var		count = 2 * nv;		// error detection 

			for ( var m = 0, v = nv - 1; nv > 2; )
			{
				// if we loop, it is probably a non-simple polygon 
				if ( 0 >= ( count-- ) )
				{
					// Triangulate: ERROR - probable bad polygon!
					return false;
				}

				// three consecutive vertices in current polygon, <u,v,w> 
				var		u = v; 
				if ( nv <= u )
				{
					u = 0;     // previous 
				}

				v = u + 1;
				if ( nv <= v )
				{
					v = 0;     // new v    
				}

				var		w = v + 1;
				if ( nv <= w )
				{
					w = 0;     // next     
				}
	
				if ( cc.Triangulate.Snip ( Contours, u, v, w, nv, V ) )
				{
					var		a, b, c, s, t;
		
					// true names of the vertices 
					a = V[u]; b = V[v]; c = V[w];

					// output Triangle 
					Results.push ( Contours [ a * 2 + 0 ] );	Results.push ( Contours [ a * 2 + 1 ] );
					Results.push ( Contours [ b * 2 + 0 ] );	Results.push ( Contours [ b * 2 + 1 ] );
					Results.push ( Contours [ c * 2 + 0 ] );	Results.push ( Contours [ c * 2 + 1 ] );

					m++;

					// remove v from remaining polygon 
					for ( s = v, t = v + 1; t < nv; s++, t++ ) V[s] = V[t]; nv--;

					// resest error detection counter 
					count = 2 * nv;
				}
			}	

			return true;		
		},
};