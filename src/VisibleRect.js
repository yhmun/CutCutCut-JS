/****************************************************************************
 Copyright (c) 2015 Young-Hwan Mun (yh.msw9@gmail.com, http://msw9.com) 
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

var s_visibleRect = cc.rect ( 0, 0, 0, 0 );

var VisibleRect = 
{
	lazyInit:function ( )
	{
		s_visibleRect = cc.rect ( cc.view.getVisibleOrigin ( ).x, cc.view.getVisibleOrigin ( ).y, cc.view.getVisibleSize ( ).width, cc.view.getVisibleSize ( ).height );
	},
	
	getVisibleRect:function ( )
	{
		VisibleRect.lazyInit ( );
		return s_visibleRect;
	},
	
	size:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.size ( s_visibleRect.width, s_visibleRect.height );
	},

	left:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x, s_visibleRect.y + s_visibleRect.height / 2 );
	},

	right:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x + s_visibleRect.width, s_visibleRect.y + s_visibleRect.height / 2 );
	},

	top:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x + s_visibleRect.width / 2, s_visibleRect.y + s_visibleRect.height );
	},

	bottom:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x + s_visibleRect.width / 2, s_visibleRect.y );
	},

	center:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x + s_visibleRect.width / 2, s_visibleRect.y + s_visibleRect.height / 2 );
	},

	leftTop:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x, s_visibleRect.y + s_visibleRect.height );
	},

	rightTop:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x + s_visibleRect.width, s_visibleRect.y + s_visibleRect.height );
	},

	leftBottom:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x, s_visibleRect.y );
	},

	rightBottom:function ( )
	{
		VisibleRect.lazyInit ( );
		return cc.p ( s_visibleRect.x + s_visibleRect.width, s_visibleRect.y );
	}	
};




