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

cc.physicsSceneCount = 0;

cc.Node.prototype._physicsBody 		  = null;
cc.Node.prototype._physicsScaleStartX = 1;
cc.Node.prototype._physicsScaleStartY = 1;

cc.Node.prototype.setPhysicsBody = function ( body )
{
	if ( this._physicsBody == body )
	{
		return;
	}

	if ( body != null )
	{
		if ( body.getNode ( ) != null )
		{
			body.getNode ( ).setPhysicsBody ( null );
		}

		body._node = this;
//		body.retain ( );

		// physics rotation based on body position, but node rotation based on node anthor point
		// it cann't support both of them, so I clear the anthor point to default.
		if ( !cc.pointEqualToPoint ( this.getAnchorPoint ( ), cc.p ( 0.5, 0.5 ) ) )
		{				
//			cc.log ( "Node warning: setPhysicsBody sets anchor point to Vec2::ANCHOR_MIDDLE." );
			this.setAnchorPoint ( cc.p ( 0.5, 0.5 ) );
		}
	}

	if ( this._physicsBody != null )
	{
		var 	world = this._physicsBody.getWorld ( );
		this._physicsBody.removeFromWorld ( );
		this._physicsBody._node = null;
//		this._physicsBody.release ( );

		if ( world != null && body != null )
		{
			world.addBody ( body );
		}
	}

	this._physicsBody = body;
	this._physicsScaleStartX = this.scaleX;
	this._physicsScaleStartY = this.scaleY;
	
	if ( body != null )
	{			
		var 	node = null;
		var		scene = null;
		for ( node = this.parent; node != null; node = node.parent )
		{
			if ( node instanceof cc.Scene )
			{
				if ( node.getPhysicsWorld ( ) != null )
				{
					scene = node;
					break;
				}
			}
		}

		if ( scene != null )
		{
			scene.getPhysicsWorld ( ).addBody ( body );
		}

		this.updatePhysicsBodyTransform ( scene );			
	}
};

/**
 *   get the PhysicsBody the sprite have
 */
cc.Node.prototype.getPhysicsBody = function ( )
{
	return this._physicsBody;
};

cc.Node.prototype.updatePhysicsBodyTransform = function ( scene )
{
	this.updatePhysicsBodyScale    ( scene );
	this.updatePhysicsBodyPosition ( scene );
	this.updatePhysicsBodyRotation ( scene );		
};

cc.Node.prototype.updatePhysicsBodyPosition = function ( scene )
{		
	if ( this._physicsBody != null )
	{
		if ( scene && scene.getPhysicsWorld ( ) )
		{											
			var 	pos = this.parent == scene ?
					this.getPosition ( ) : scene.convertToNodeSpace ( this.parent.convertToWorldSpace ( this.getPosition ( ) ) );
					this._physicsBody.setPosition ( pos );
		}
		else
		{
			this._physicsBody.setPosition ( this.getPosition ( ) );
		}
	}

	for ( var idx in this._children )
	{
		var		child = this._children [ idx ];
		child.updatePhysicsBodyPosition ( scene );		
	}		
};

cc.Node.prototype.updatePhysicsBodyRotation = function ( scene )
{		
	if ( this._physicsBody != null )
	{
		if ( scene && scene.getPhysicsWorld ( ) )
		{
			var 	rotation = this.rotationX;
			for ( var parent = this.parent; parent != scene; parent = parent.parent )
			{
				rotation += parent.rotationX;
			}
			this._physicsBody.setRotation ( rotation );
		}
		else
		{				
			this._physicsBody.setRotation ( this.rotationX );
		}
	}

	for ( var idx in this._children )
	{
		var		child = this._children [ idx ];
		child.updatePhysicsBodyRotation ( scene );		
	}
};

cc.Node.prototype.updatePhysicsBodyScale = function ( scene )
{		
	if ( this._physicsBody != null )
	{
		if ( scene && scene.getPhysicsWorld ( ) )
		{
			var 	scaleX = this.scaleX / this._physicsScaleStartX;
			var	 	scaleY = this.scaleY / this._physicsScaleStartY;
			for ( var parent = this.parent; parent != scene; parent = parent.parent )
			{
				scaleX *= parent.scaleX;
				scaleY *= parent.scaleY;
			}
			this._physicsBody.setScale ( scaleX, scaleY );
		}
		else
		{				
			this._physicsBody.setScale ( this.scaleX / this._physicsScaleStartX, this.scaleY / this._physicsScaleStartY );
		}
	}

	for ( var idx in this._children )
	{
		var		child = this._children [ idx ];
		child.updatePhysicsBodyScale ( scene );		
	}		
};

cc.Node.prototype.getScene = function ( ) 
{		
	if ( !this.parent )
	{
		return null;
	}

	var 	sceneNode = this.parent;
	while ( sceneNode.parent )
	{
		sceneNode = sceneNode.parent;
	}

	if ( sceneNode instanceof cc.Scene )
	{
		return sceneNode;
	}
	else
	{
		return null;
	}		
};

cc.Node.prototype.addChildEx = function ( child, localZOrder, tag )
{
	if ( localZOrder === undefined ) localZOrder = 0;
	if ( tag 		 === undefined ) tag = child.tag;
	
	this.addChild ( child, localZOrder, tag );
	
	// Recursive add children with which have physics body.
	var 	scene = this.getScene ( );
	if ( scene && scene.getPhysicsWorld ( ) )
	{
		child.updatePhysicsBodyTransform ( scene );
		scene.addChildToPhysicsWorld ( child );
	}		
};

cc.Node.prototype.removeChildEx = function ( child, cleanup )
{
	if ( cleanup === undefined ) cleanup = true;

	if ( child._physicsBody != null )
	{
		child._physicsBody.removeFromWorld ( );
	}
	
	this.removeChild ( child, cleanup );
};

cc.Node.prototype.removeFromParentEx = function ( cleanup )
{
	if ( cleanup === undefined ) cleanup = true;
	
	if ( this._physicsBody != null )
	{
		this._physicsBody.removeFromWorld ( );
	}

	this.removeFromParent ( cleanup );
};

cc.Node.prototype.setPosition = function ( newPosOrxValue, yValue )
{
	if ( yValue === undefined )
	{
		this.x = newPosOrxValue.x;
		this.y = newPosOrxValue.y;
	}
	else 
	{
		this.x = newPosOrxValue;
		this.y = yValue;
	}

	if ( this._physicsBody != null )
	{						
		this.updatePhysicsBodyPosition ( this.getScene ( ) );
	}	
};

cc.Node.prototype.setScale = function ( scale, scaleY )
{
	if ( scaleY === undefined )	
	{
		this.scaleX = scale;
		this.scaleY = scale;
	}
	else
	{
		this.scaleX = scale;
		this.scaleY = scaleY;		
	}
	
	if ( cc.g_physicsSceneCount == 0 )
	{
		return;
	}

	var 	scene = this.getScene ( );
	if ( !scene || scene.getPhysicsWorld ( ) )
	{
		this.updatePhysicsBodyTransform ( scene );
	}		
};

cc.Node.prototype.setScaleX = function ( newScaleX )
{
	this.scaleX = newScaleX;
	
	if ( cc.g_physicsSceneCount == 0 )
	{
		return;
	}

	var 	scene = this.getScene ( );
	if ( !scene || scene.getPhysicsWorld ( ) )
	{
		this.updatePhysicsBodyTransform ( scene );
	}	
};

cc.Node.prototype.setScaleY = function ( newScaleY )
{
	this.scaleY = newScaleY;
	
	if ( cc.g_physicsSceneCount == 0 )
	{
		return;
	}

	var 	scene = this.getScene ( );
	if ( !scene || scene.getPhysicsWorld ( ) )
	{
		this.updatePhysicsBodyTransform ( scene );
	}	
};

cc.Node.prototype.setRotation = function ( newRotation )
{
	this.rotationX = this.rotationY = newRotation;	

	if ( !this._physicsBody || !this._physicsBody._rotationResetTag )
	{
		this.updatePhysicsBodyRotation ( this.getScene ( ) );
	}		
};