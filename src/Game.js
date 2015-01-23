/** ----------------------------------------------------------------------------------
 *
 *      File            GameScene.js
 *      Ported By       Young-Hwan Mun
 *      Contact         yh.msw9@gmail.com
 * 
 * -----------------------------------------------------------------------------------
 *   
 *      Copyright (c) 2012      Allen Benson G Tan on 5/19/12 
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

msw.TossType =
{
	Consecutive		: 0	,
	Simultaneous	: 1 ,	
};

msw.frandom_range = function ( low, high )
{
	return ( high - low ) * cc.random0To1 ( ) + low;
};

msw.Game = cc.Layer.extend
({
	ctor:function ( )
	{
		this._super ( );
		
		// the sprite cache
	    this.caches			 	= null; 
	    
	    // variables for the blade effect
	    this.blades 		 	= null;
	    this.blade 			 	= null;
	    this.delta_remainder 	= 0.0;
	    
	    // variables for ray casting
	    this.start_point	 	= cp.vzero;
	    this.end_point		 	= cp.vzero;	  
	    
	    // variables for tossing mechanic
	    this.next_toss_time  	= 0;
	    this.toss_interval	 	= 0;
	    this.queued_for_toss 	= 0;
	    this.current_toss_type 	= 0;
	    
	    // variables for scoring
	    this.cuts	 		 	= 0;
	    this.lives 			 	= 0;
	    this.cuts_label		 	= null;
	    
	    // particle effect for the blade
	    this.blade_sparkle		= null;
	    
	    // variables for playing the swoosh sound
	    this.time_current  	 	= 0;
	    this.time_rrevious 	 	= 0;
	    this.swoosh				= 0;
	},
	
	onEnter:function ( )
	{
		this._super ( );
		
		this.initPhysics 	( ); 
		this.initBackground ( );
		this.initSprites	( );
	    this.initHUD		( );		

	    var		texture = cc.textureCache.addImage ( "res/Images/streak.png" );

	    this.blades = new Array ( 3 );	 
	    for ( var i = 0; i < 3; i++ )
	    {
	    	var	 	blade = new cc.Blade ( 50 );
	    	blade.setAutoDim ( false );
	    	blade.setTexture ( texture );

	    	this.addChild ( blade, 2 );
	    	this.blades.push ( blade );
	    }	
	    
	    // enable events
	    cc.eventManager.addListener 
	    ({
	    	event : cc.EventListener.TOUCH_ONE_BY_ONE,
	    	swallowTouches : true,
	    	onTouchBegan : this.onTouchBegan.bind ( this ),
	    	onTouchMoved : this.onTouchMoved.bind ( this ),
	    	onTouchEnded : this.onTouchEnded.bind ( this )
	    }, this );
	    	    
	    /*
		// initialize variables for cutting
		m_pRaycastCallback = new RaycastCallback ( );
	     */

		// initialize the blade sparkle particle effect
	    this.blade_sparkle = new cc.ParticleSystem ( "res/Particles/blade_sparkle.plist" );
	    this.blade_sparkle.stopSystem ( );
	    this.addChild ( this.blade_sparkle, 3 );
	    
		// initialize all sound 
	    cc.audioEngine.playMusic ( "res/Sounds/nature_bgm.mp3" );		

	    this.scheduleUpdate ( );
	},

	/**
	 *	Initializes the physics
	 */
	initPhysics:function ( )
	{
		this.getParent ( ).initWithPhysics ( );

		this.getParent ( ).getPhysicsWorld ( ).setDebugDrawMask ( cc.PhysicsWorld.DEBUGDRAW_ALL );
		this.getParent ( ).getPhysicsWorld ( ).setGravity ( cp.v ( 0, -120 ) );		
	},

	/**
	 *	Initializes everything in the background
	 */
	initBackground:function ( )
	{
		// add the background image
		var		bg = new cc.Sprite.create ( "res/Images/bg.png" );
		bg.setPosition ( VisibleRect.center ( ) );
		this.addChild ( bg );

		// add the particle effect
		var		sun_pollen = new cc.ParticleSystem ( "res/Particles/sun_pollen.plist" );
		sun_pollen.setPosition ( cp.v.add ( VisibleRect.leftBottom ( ), sun_pollen.getPosition ( ) ) );
		this.addChild ( sun_pollen );
	},

	/**
	 *	Initializes the sprite cache and populates it with sprites
	 */
	initSprites:function ( )
	{		
		this.caches = new Array ( );

		for ( var i = 0; i < 10; i++ )
		{
			var		sprite = new msw.Watermelon ( );
			sprite.setPosition ( cp.v.add ( VisibleRect.leftBottom ( ), cc.p ( -64 * ( i + 1 ), -64 ) ) );			
	
			this.addChildEx ( sprite, 1 );
			this.addChild ( sprite.getSplurt ( ), 3 );			
			this.caches.push ( sprite );
		}

		for ( var i = 0; i < 10; i++ )
		{
			var		sprite = new msw.Strawberry ( );
			sprite.setPosition ( cp.v.add ( VisibleRect.leftBottom ( ), cc.p ( -64 * ( i + 1 ), -64 ) ) );

			this.addChildEx ( sprite, 1 );
			this.addChild ( sprite.getSplurt ( ), 3 );			
			this.caches.push ( sprite );
		}	

		for ( var i = 0; i < 10; i++ )
		{
			var		sprite = new msw.Pineapple ( );
			sprite.setPosition ( cp.v.add ( VisibleRect.leftBottom ( ), cc.p ( -64 * ( i + 1 ), -64 ) ) );			

			this.addChildEx ( sprite, 1 );
			this.addChild ( sprite.getSplurt ( ), 3 );			
			this.caches.push ( sprite );
		}	

		for ( var i = 0; i < 10; i++ )
		{
			var		sprite = new msw.Grapes ( );			
			sprite.setPosition ( cp.v.add ( VisibleRect.leftBottom ( ), cc.p ( -64 * ( i + 1 ), -64 ) ) );

			this.addChildEx ( sprite, 1 );
			this.addChild ( sprite.getSplurt ( ), 3 );			
			this.caches.push ( sprite );
		}	

		for ( var i = 0; i < 10; i++ )
		{
			var		sprite = new msw.Banana ( );
			sprite.setPosition ( cp.v.add ( VisibleRect.leftBottom ( ), cc.p ( -64 * ( i + 1 ), -64 ) ) );
			
			this.addChildEx ( sprite, 1 );
			this.addChild ( sprite.getSplurt ( ), 3 );			
			this.caches.push ( sprite );
		}	
		
		for ( var i = 0; i < 3; i++ )
		{
			var		sprite = new msw.Bomb ( );
			sprite.setPosition ( cp.v.add ( VisibleRect.leftBottom ( ), cc.p ( -64 * ( i + 1 ), -64 ) ) );
	
			this.addChildEx ( sprite, 1 );
			this.addChild ( sprite.getSplurt ( ), 3 );			
			this.caches.push ( sprite );
		}		
	},
	
	/**
	 *	Initializes the score and lives
	 */
	initHUD:function ( )
	{	    
	    this.cuts  = 0;
	    this.lives = 5;
	    
	    // add unfilled crosses at the upper right corner of the screen
	    for ( var i = 0; i < 5; i++ )
	    {
	    	var		cross = new cc.Sprite ( "res/Images/x_unfilled.png" );
	    	var		size  = cross.getContentSize ( );
	    	cross.setPosition ( cc.p ( VisibleRect.right ( ).x - size.width / 2 - i * size.width, VisibleRect.top ( ).y - size.height / 2 ) );
	        this.addChild ( cross, 4 );
	    }
	    
	    // add an icon to represent the score
		var		cuts_icon = new cc.Sprite ( "res/Images/fruit_cut.png" );
		var 	size = cuts_icon.getContentSize ( );
		cuts_icon.setPosition ( cc.p ( VisibleRect.left ( ).x + size.width / 2, VisibleRect.top ( ).y - size.height / 2 ) );
	    this.addChild ( cuts_icon );
	    
	    // add a label that shows the score
		this.cuts_label = new cc.LabelTTF ( "0", "res/Fonts/Marker Felt.ttf", 30 );
		var 	size = this.cuts_label.getContentSize ( );
		this.cuts_label.setAnchorPoint ( cc.p ( 0, 0.5 ) );
		this.cuts_label.setPosition ( cc.p ( cuts_icon.getPosition ( ).x + cuts_icon.getContentSize ( ).width / 2 + size.width / 2, cuts_icon.getPosition ( ).y ) );
		this.addChild ( this.cuts_label, 4 );	    
	},	
	
	onTouchBegan:function ( touch, event )
	{
		var		location = touch.getLocation ( );
		this.end_point = this.start_point = location;

		for ( var i in this.blades )
		{
			var		blade = this.blades [ i ];

			if ( blade.getPath ( ).length == 0 )
			{
				this.blade = blade;
				this.blade.push ( location );
				break;
			}
		}

		// move the sparkle to the touch
		this.blade_sparkle.setPosition ( location );
		this.blade_sparkle.resetSystem ( );
		
		return true;
	},

	onTouchMoved:function ( touch, event )
	{
		var		location = touch.getLocation ( );
		this.end_point = location;

		if ( cp.v.dist ( this.start_point, this.end_point ) > 25 )
		{
			this.getParent ( ).getPhysicsWorld ( ).rayCast ( this.slice.bind ( this ), this.start_point, this.end_point, null );			
			this.getParent ( ).getPhysicsWorld ( ).rayCast ( this.slice.bind ( this ), this.end_point, this.start_point, null );

			this.start_point = this.end_point;

			// add a point to the blade
			this.blade.push ( location );

			var		delta_time = this.time_current - this.time_previous;
			this.time_previous = this.time_current;

			// calculate the velocity (distance / time)
			var		old_position = this.blade_sparkle.getPosition ( );

			// sparkle follows the touch
			this.blade_sparkle.setPosition ( location );

			// play the sound if velocity is past a certain value
			if ( cp.v.dist ( this.blade_sparkle.getPosition ( ), old_position ) / delta_time > 1000 )
			{
				cc.audioEngine.playEffect ( "res/Sounds/swoosh.wav" );								
			}			
		}		
	},

	onTouchEnded:function ( touch, event )
	{
		// remove all entry and exit points from all polygons
		//this->clearSlices ( );

		// fade the blade
		this.blade.setDim ( true );

		// sparkle effect stops
		this.blade_sparkle.stopSystem ( );
	},	

	/**
	 *	Main update loop
	 */
	update:function ( delta )
	{		
		// tossing
		this.spriteLoop ( );
	
		// slicing
		this.checkAndSliceObjects ( );

		// cleaning
		this.cleanSprites ( );		

		// handles the fading trail of the blade effect
		if ( this.blade && this.blade.getPath ( ).length > 3 )
		{
			this.delta_remainder += delta * 60 * 1.2;
			var		pop = Math.round ( this.delta_remainder );
			this.delta_remainder -= pop;
			this.blade.pop ( pop );
		}		

		// update the time used by the swoosh sound
		this.time_current += delta;				
	},

	/**
	 *	The main loop for tossing sprites. Picks out random fruits to be tossed based on a toss type.
	 */
	spriteLoop:function ( )
	{
		// execute only when it's time to toss sprites again
		if ( this.time_current > this.next_toss_time )
		{		
			var		chance = parseInt ( cc.rand ( ) % 8 );
			if ( chance == 0 )
			{				
				for ( var i in this.caches )
				{
					var		sprite =  this.caches [ i ];
					
					if ( sprite.getState ( ) == cc.PolygonSpriteEx.State.Idle && sprite.getType ( ) == cc.PolygonSpriteEx.Type.Bomb )
					{
						this.tossSprite ( sprite );
						cc.audioEngine.playEffect ( "res/Sounds/toss_bomb.wav" );	
						break;
					}
				}
			}
			
			// if we haven't run out of fruits to toss for consecutive tossing, toss another
			var		type = parseInt ( msw.frandom_range ( 0, 4 ) );
			if ( this.current_toss_type == msw.TossType.Consecutive && this.queued_for_toss > 0 )
			{				
				for ( var i in this.caches )
				{
					var		sprite =  this.caches [ i ];

					if ( sprite.getState ( ) == cc.PolygonSpriteEx.State.Idle && sprite.getType ( ) == type )
					{
						this.tossSprite ( sprite );
						this.queued_for_toss--;
						cc.audioEngine.playEffect ( "res/Sounds/toss_consecutive.wav" );
						break;
					}
				}				
			}
			else
			{
				// determine toss type and number of fruits to toss
				this.queued_for_toss   = parseInt ( msw.frandom_range ( 3, 8 ) ); 
				this.current_toss_type = parseInt ( msw.frandom_range ( 0, 1 ) ); 
				
				if ( this.current_toss_type == msw.TossType.Simultaneous )
				{			
					// toss fruits simultaneously
					for ( var i in this.caches )
					{
						var		sprite =  this.caches [ i ];

						if ( sprite.getState ( ) == cc.PolygonSpriteEx.State.Idle && sprite.getType ( ) == type )
						{
							this.tossSprite ( sprite );
							this.queued_for_toss--;

	                        // get a different fruit type	                        
	                        type = parseInt ( msw.frandom_range ( 0, 4 ) );

	                        if ( this.queued_for_toss == 0 )
	                        {
	                            break;
	                        }
	                    }
	                }

					cc.audioEngine.playEffect ( "res/Sounds/toss_simultaneous.wav" );						 
	            }
				else if ( this.current_toss_type == msw.TossType.Consecutive )
				{				            
					// toss fruits consecutively
					for ( var i in this.caches )
					{
						var		sprite =  this.caches [ i ];

	                    if ( sprite.getState ( ) == cc.PolygonSpriteEx.State.Idle && sprite.getType ( ) == type )
	                    {
	                        // just toss one fruit
	                        this.tossSprite ( sprite );
							cc.audioEngine.playEffect ( "res/Sounds/toss_consecutive.wav" );	   
	                        this.queued_for_toss--;
	                        break;
	                    }
					}							 
	            }				
			}

			// randomize an interval
			if ( this.queued_for_toss == 0 )
	        {
	        	// if no more fruits to toss, set a longer interval
	        	this.toss_interval = msw.frandom_range ( 2, 3 );
	            this.next_toss_time = this.time_current + this.toss_interval;
	        }
	        else 
	        {
	        	// if more fruits to toss, set a shorter interval
	        	this.toss_interval = msw.frandom_range ( 0.3, 0.8 );
	        	this.next_toss_time = this.time_current + this.toss_interval;
	        }		
	    }
	},

	/**
	 *	Handles sprites that have fallen offscreen
	 */
	cleanSprites:function ( )
	{
		// we check for all tossed sprites that have dropped offscreen and reset them
		for ( var i = 0; i < this.caches.length;  )
		{
			var		sprite =  this.caches [ i ];

			if ( sprite.getState ( ) == cc.PolygonSpriteEx.State.Tossed )
			{
				var		position   = sprite.getPhysicsBody ( ).getPosition ( );
				var		velocity_y = sprite.getPhysicsBody ( ).getVelocity ( ).y;
				
				// this means the sprite has dropped offscreen
				if ( position.y < VisibleRect.bottom ( ).y - 64 && velocity_y < 0 )
				{
					this.caches.splice ( i, 1 );
					this.removeChildEx ( sprite );
					
					cc.log ( "re" + i );
					/*
					sprite.setState ( cc.PolygonSpriteEx.State.Idle );
					sprite.setSliceEntered ( false );
					sprite.setSliceExited  ( false );
					sprite.setEntryPoint ( cp.vzero );
					sprite.setExitPoint  ( cp.vzero );
					sprite.setPosition ( cp.v ( -64, -64 ) );
					sprite.getPhysicsBody ( ).setVelocity ( cp.vzero );
					sprite.getPhysicsBody ( ).setAngularVelocity ( 0.0 );
					sprite.deactivateCollisions ( );
					*/
		            
					if ( sprite.getType ( ) != cc.PolygonSpriteEx.Type.Bomb )
					{
						this.subtractLife ( );
					}		
					
					continue;										
				}				
			}
			
			i++;
		}
		/*
		// we check for all sliced pieces that have dropped offscreen and remove them
		var		bodies = this.getParent ( ).getPhysicsWorld ( ).getAllBodies ( );		
		for ( var i in bodies )
		{
			var		sprite = bodies [ i ].getNode ( );
			
			if ( sprite && sprite instanceof cc.PolygonSpriteEx )
			{
				var		pos = sprite.getPosition ( );
				
				if ( pos.x < VisibleRect.left ( ).x - 64 || pos.x > VisibleRect.right ( ).x + 64 || pos.y < VisibleRect.bottom ( ).y - 64 )
				{
					if ( sprite.isOriginal ( ) )
					{
						cc.log ( "re" + i );
						
					}
				}				
			}		 	
		}
		*/
		
		/*

		
		const CCSize&	tWinSize = CCDirector::sharedDirector ( )->getWinSize ( );
		for ( b2Body* b = m_pWorld->GetBodyList ( ); b; b = b->GetNext ( ) )
		{
			if ( b->GetUserData ( ) != KD_NULL )
			{
				PolygonSpriteEx*	pSprite = (PolygonSpriteEx*) b->GetUserData ( );
				CCPoint				tPosition = ccp ( b->GetPosition ( ).x * PTM_RATIO, b->GetPosition ( ).y * PTM_RATIO );
				if ( tPosition.x < -64 || tPosition.x > tWinSize.cx || tPosition.y < -64 )
				{
					if ( !pSprite->isOriginal ( ) )
					{
						m_pWorld->DestroyBody ( pSprite->getBody ( ) );
						this->removeChild ( pSprite, KD_TRUE ); 
					}
				}
			}
		}
		*/
	},
	
	/**
	 *	Assigns a random position, linear, and angular velocity to a sprite.
	 */
	tossSprite:function ( sprite )
	{
		// set a random position and rotation rate
		var		random_position = cp.v ( msw.frandom_range ( VisibleRect.left ( ).x + 64, VisibleRect.right ( ).x - 64 ), VisibleRect.bottom ( ).y - 64 );
		var		random_angular_velocity = msw.frandom_range ( -1, 1 );

		// limit the velocity based on their position so that sprites aren't tossed offscreen
		var		modifier_x = 50 * ( random_position.x - 100 ) / ( VisibleRect.right ( ).x - 264 );
		var		min = -25.0 - modifier_x;
		var		max =  75.0 - modifier_x;

		var		random_x_velocity = msw.frandom_range ( min, max );
		var		random_y_velocity = msw.frandom_range ( 250, 300 );

		// activate and toss the sprite
		sprite.setState ( cc.PolygonSpriteEx.State.Tossed );
		sprite.setPosition ( random_position );
		sprite.activateCollisions ( );

		sprite.getPhysicsBody ( ).setVelocity ( cp.v ( random_x_velocity, random_y_velocity ) );
		sprite.getPhysicsBody ( ).setAngularVelocity ( random_angular_velocity );		
	},
	
	slice:function ( world, info, data )
	{
		
	},

	/**
	 *	Responsible for checking all sprites that have been cut, and splits them.
	 */
	checkAndSliceObjects:function ( )
	{
		/*
	    KDfloat		fCurTime = kdGetMilliseconds ( ) / 1000;
	
	    for ( b2Body* b = m_pWorld->GetBodyList ( ); b; b = b->GetNext ( ) )
	    {
	        if ( b->GetUserData ( ) != NULL )
			{
	            PolygonSpriteEx*	pSprite = (PolygonSpriteEx*) b->GetUserData ( );
	
	            if ( pSprite->isSliceEntered ( ) && fCurTime > pSprite->getSliceEntryTime ( ) ) 
	            {
					// if the sprite entry time has expired, reset the state of the sprite
	                pSprite->setSliceEntered ( KD_FALSE );
	            }
	            else if ( pSprite->isSliceEntered ( ) && pSprite->isSliceExited ( ) )
	            {
					// if the sprite has been cut, then split the sprite
	                this->splitPolygonSprite ( pSprite );
	            }
	        }
	    }
		*/
	},
	
	/**
	 *	Removes all slice entry and exit points of all PolygonSprites
	 */
	clearSlices:function ( )
	{
		/*
		for ( b2Body* b = m_pWorld->GetBodyList ( ); b; b = b->GetNext ( ) )
		{
			if ( b->GetUserData ( ) != KD_NULL )
			{
				PolygonSpriteEx*	pSprite = (PolygonSpriteEx*) b->GetUserData ( );
				pSprite->setSliceEntered ( KD_FALSE );
				pSprite->setSliceExited  ( KD_FALSE );
			}
		}
		*/
	},
	
	/**
	 *	Splits a PolygonSprite into two new PolygonSprites
	 */
	splitPolygonSprite:function ( sprite )
	{
		/*
		// declare & initialize variables to be used for later
		PolygonSprite*		pNewSprite1;
		PolygonSprite*		pNewSprite2;

		// our original shape's attributes
		b2Fixture*			pOriginalFixture = pSprite->getBody ( )->GetFixtureList ( );
		b2PolygonShape*		pOriginalPolygon = (b2PolygonShape*) pOriginalFixture->GetShape ( );
		KDint				nVertexCount = pOriginalPolygon->GetVertexCount ( );

		for ( KDint i = 0; i < nVertexCount; i++ )
		{
			b2Vec2	tPoint = pOriginalPolygon->GetVertex ( i );
		}

		// our determinant(to be described later) and iterator
		KDfloat		fDeterminant;
		KDint		i;

		// we store the vertices of our two new sprites here
		b2Vec2*		pSprite1Vertices = (b2Vec2*) kdCalloc ( 24, sizeof ( b2Vec2 ) );
		b2Vec2*		pSprite2Vertices = (b2Vec2*) kdCalloc ( 24, sizeof ( b2Vec2 ) );
		b2Vec2*		pSprite1VerticesSorted;
		b2Vec2*		pSprite2VerticesSorted;

		// we store how many vertices there are for each of the two new sprites here
		KDint		nSprite1VertexCount = 0;
		KDint		nSprite2VertexCount = 0;

		// step 1:
		// the entry and exit point of our cut are considered vertices of our two new shapes, so we add these before anything else
		pSprite1Vertices [ nSprite1VertexCount++ ] = pSprite->getEntryPoint ( );
		pSprite1Vertices [ nSprite1VertexCount++ ] = pSprite->getExitPoint  ( );
		pSprite2Vertices [ nSprite2VertexCount++ ] = pSprite->getEntryPoint ( );
		pSprite2Vertices [ nSprite2VertexCount++ ] = pSprite->getExitPoint  ( );

		//step 2:
		// iterate through all the vertices clockwise and counter-clockwise from the cutting line, and add them to each sprite's shape
		for ( i = 0; i < nVertexCount; i++ )
		{
			//get our vertex from the polygon
			b2Vec2		tPoint = pOriginalPolygon->GetVertex ( i );

			//we check if our point is not the same as our entry or exit point first
			b2Vec2		tDiffFromEntryPoint = tPoint - pSprite->getEntryPoint ( );
			b2Vec2		tDiffFromExitPoint  = tPoint - pSprite->getExitPoint  ( );

			if ( ( tDiffFromEntryPoint.x == 0 && tDiffFromEntryPoint.y == 0 ) || ( tDiffFromExitPoint.x == 0 && tDiffFromExitPoint.y == 0 ) )
			{
			}
			else 
			{
				// mathematically determine the direction of a point
				fDeterminant = calculate_determinant_2x3 ( pSprite->getEntryPoint ( ).x, pSprite->getEntryPoint ( ).y, pSprite->getExitPoint ( ).x, pSprite->getExitPoint ( ).y, tPoint.x, tPoint.y );

				if ( fDeterminant > 0 )
				{
					// if the determinant is positive, then the three points are in clockwise order
					pSprite1Vertices [ nSprite1VertexCount++ ] = tPoint;
				}
				else
				{
					// if the determinant is 0, the points are on the same line. if the determinant is negative, then they are in counter-clockwise order
					pSprite2Vertices [ nSprite2VertexCount++ ] = tPoint;                
				}
			}
		}

		// step 3:
		// Box2D needs vertices to be arranged in counter-clockwise order so we reorder our points using a custom function
		pSprite1VerticesSorted = this->arrangeVertices ( pSprite1Vertices, nSprite1VertexCount );
		pSprite2VerticesSorted = this->arrangeVertices ( pSprite2Vertices, nSprite2VertexCount );

		// step 4:
			// Box2D has some restrictions with defining shapes, so we have to consider these. We only cut the shape if both shapes pass certain requirements from our function
		KDbool		bSprite1VerticesAcceptable = this->areVerticesAcceptable ( pSprite1VerticesSorted, nSprite1VertexCount );
		KDbool		bSprite2VerticesAcceptable = this->areVerticesAcceptable ( pSprite2VerticesSorted, nSprite2VertexCount );

		// step 5:
		// we destroy the old shape and create the new shapes and sprites
		if ( bSprite1VerticesAcceptable && bSprite2VerticesAcceptable )
		{
			b2Vec2		tWorldEntry = pSprite->getBody ( )->GetWorldPoint ( pSprite->getEntryPoint ( ) );
			b2Vec2		tWorldExit	= pSprite->getBody ( )->GetWorldPoint ( pSprite->getExitPoint  ( ) );
			KDfloat		fAngle		= ccpToAngle ( ccpSub ( ccp ( tWorldExit.x, tWorldExit.y ), ccp ( tWorldEntry.x, tWorldEntry.y ) ) );
			CCPoint		tVector1	= ccpForAngle ( fAngle + 1.570796f );
			CCPoint		tVector2	= ccpForAngle ( fAngle - 1.570796f );

			// calculate the midpoint based on world coordinates
			KDfloat		fMidX = midpoint ( tWorldEntry.x, tWorldExit.x );
			KDfloat		fMidY = midpoint ( tWorldEntry.y, tWorldExit.y );

			// create the first sprite's body        
			b2Body*		pBody1 = this->createBodyWithPosition ( pSprite->getBody ( )->GetPosition ( ), pSprite->getBody ( )->GetAngle ( ), pSprite1VerticesSorted, nSprite1VertexCount, pOriginalFixture->GetDensity ( ), pOriginalFixture->GetFriction ( ), pOriginalFixture->GetRestitution ( ) );

			// create the first sprite
			pNewSprite1 = PolygonSpriteEx::createWithTexture ( pSprite->getTexture ( ),  pBody1, KD_FALSE, PTM_RATIO );
			this->addChild ( pNewSprite1, 1 );

			// push the sprite away from the second sprite
			pNewSprite1->getBody ( )->ApplyLinearImpulse ( b2Vec2 ( 2 * pBody1->GetMass ( ) * tVector1.x, 2 * pBody1->GetMass ( ) * tVector1.y ), b2Vec2 ( fMidX, fMidY ) );

			// create the second sprite's body
			b2Body*		pBody2 = this->createBodyWithPosition ( pSprite->getBody ( )->GetPosition ( ), pSprite->getBody ( )->GetAngle ( ), pSprite2VerticesSorted, nSprite2VertexCount, pOriginalFixture->GetDensity ( ), pOriginalFixture->GetFriction ( ), pOriginalFixture->GetRestitution ( ) );

			// create the second sprite
			pNewSprite2 = PolygonSpriteEx::createWithTexture ( pSprite->getTexture ( ),  pBody2, KD_FALSE, PTM_RATIO );
			this->addChild ( pNewSprite2, 1 );

			// push the sprite away from the first sprite
			pNewSprite2->getBody ( )->ApplyLinearImpulse ( b2Vec2 ( 2 * pBody2->GetMass ( ) * tVector2.x, 2 * pBody2->GetMass ( ) * tVector2.y ), b2Vec2 ( fMidX, fMidY ) );

			// we don't need the old shape & sprite anymore so we either destroy it or squirrel it away
			if ( pSprite->isOriginal ( ) )
			{   
				b2Vec2		tZero ( 0, 0 );

				// particles should appear in the middle of the cut
				b2Vec2		tConvertedWorldEntry = b2Vec2 ( tWorldEntry.x * PTM_RATIO, tWorldEntry.y * PTM_RATIO );
				b2Vec2		tConvertedWorldExit  = b2Vec2 ( tWorldExit .x * PTM_RATIO, tWorldExit .y * PTM_RATIO );
				KDfloat		fMidX = midpoint ( tConvertedWorldEntry.x, tConvertedWorldExit.x );
				KDfloat		fMidY = midpoint ( tConvertedWorldEntry.y, tConvertedWorldExit.y );
				pSprite->getSplurt ( )->setPosition ( ccp ( fMidX, fMidY ) );
				pSprite->getSplurt ( )->resetSystem ( );

				// reset the state of the sprite
				pSprite->setState ( kStateIdle ); 

				pSprite->deactivateCollisions ( );

				pSprite->setPosition ( ccp ( -256, -256 ) );   // cast them faraway
				pSprite->setSliceEntered ( KD_FALSE );
				pSprite->setSliceExited  ( KD_FALSE );
				pSprite->setEntryPoint ( tZero );
				pSprite->setExitPoint  ( tZero );

				if ( pSprite->getType ( ) == kTypeBomb )
				{
					SimpleAudioEngine::sharedEngine ( )->playEffect ( "explosion.wav" );
					this->subtractLife ( );
				}
				else
				{
					SimpleAudioEngine::sharedEngine ( )->playEffect ( "squash.wav" );
				}
			}
			else 
			{
				SimpleAudioEngine::sharedEngine ( )->playEffect ( "smallcut.wav" );
				m_pWorld->DestroyBody ( pSprite->getBody ( ) );
				this->removeChild ( pSprite, KD_TRUE );
			}		
			m_nCuts++;
			m_pCutsLabel->setString ( ccszf ( "%d", m_nCuts ) );
		}
		else
		{
			pSprite->setSliceEntered ( KD_FALSE );
			pSprite->setSliceExited  ( KD_FALSE );
		}

		// free up our allocated vectors
		kdFree ( pSprite1VerticesSorted );
		kdFree ( pSprite2VerticesSorted );	
		kdFree ( pSprite1Vertices );
		kdFree ( pSprite2Vertices );
		*/
	},
	
	/**
	 *	Arranges all given points in a counter clockwise order
	 */
	arrangeVertices:function ( vertices )
	{
		/*
		KDfloat		fDeterminant;
		KDint		nCounterClockWise = 1;
		KDint		nClockWise = nCount - 1;
		KDint		i;

		b2Vec2		tReferencePointA;
		b2Vec2		tReferencePointB;
		b2Vec2*		pSortedVertices = (b2Vec2*) kdCalloc ( nCount, sizeof ( b2Vec2 ) );

		// sort all vertices in ascending order according to their x-coordinate so we can get two points of a line
		kdQsort ( pVertices, nCount, sizeof ( b2Vec2 ), comparator );

		pSortedVertices [ 0 ] = pVertices [ 0 ];
		tReferencePointA = pVertices [ 0 ];					// leftmost point
		tReferencePointB = pVertices [ nCount - 1 ];		// rightmost point

		// we arrange the points by filling our vertices in both clockwise and counter-clockwise directions using the determinant function
		for ( i = 1; i < nCount - 1; i++ )
		{
			fDeterminant = calculate_determinant_2x3 ( tReferencePointA.x, tReferencePointA.y, tReferencePointB.x, tReferencePointB.y, pVertices [ i ].x, pVertices [ i ].y );
			if ( fDeterminant < 0 )
			{
				pSortedVertices [ nCounterClockWise++ ] = pVertices [ i ];
			}
			else 
			{
				pSortedVertices [ nClockWise-- ] = pVertices [ i ];
			}
		}

		pSortedVertices [ nCounterClockWise ] = pVertices [ nCount - 1 ];
		return pSortedVertices;
		*/
	},
	
	/**
	 *	Determines if a shape's vertices are acceptable by Box2D standards
	 */
	areVerticesAcceptable:function ( vertices )
	{
		/*
		// check 1: polygons need to at least have 3 vertices
		if ( nCount < 3 )
		{
			return KD_FALSE;
		}

		// check 2: the number of vertices cannot exceed b2_maxPolygonVertices
		if ( nCount > b2_maxPolygonVertices )
		{
			return KD_FALSE;
		}

		// check 3: Box2D needs the distance from each vertex to be greater than b2_epsilon
		KDint	 i;
		for ( i = 0; i < nCount; ++i )
		{
			KDint	i1 = i;
			KDint	i2 = i + 1 < nCount ? i + 1 : 0;
			b2Vec2	tEdge = pVertices [ i2 ] - pVertices [ i1 ];
			if ( tEdge.LengthSquared ( ) <= b2_epsilon * b2_epsilon )
			{
				return KD_FALSE;
			}
		}

		// check 4: Box2D needs the area of a polygon to be greater than b2_epsilon
		KDfloat		fArea = 0.0f;

		b2Vec2		tRef ( 0.0f,0.0f );

		for ( i = 0; i < nCount; ++i )
		{
			b2Vec2	p1 = tRef;
			b2Vec2	p2 = pVertices [ i ];
			b2Vec2	p3 = i + 1 < nCount ? pVertices [ i + 1 ] : pVertices [ 0 ];

			b2Vec2	e1 = p2 - p1;
			b2Vec2	e2 = p3 - p1;

			KDfloat	 D = b2Cross(e1, e2);

			KDfloat	 fTriangleArea = 0.5f * D;
			fArea += fTriangleArea;
		}

		// we assign a value of 0.0001 since anything further is too small to see anyway
		if ( fArea <= 0.0001f )
		{
			return KD_FALSE;
		}

		// check 5: Box2D requires that the shape be Convex.
		KDfloat		fDeterminant;
		KDfloat		fReferenceDeterminant;
		b2Vec2		v1 = pVertices [ 0 ] - pVertices [ nCount - 1 ];
		b2Vec2		v2 = pVertices [ 1 ] - pVertices [ 0 ];
		fReferenceDeterminant = calculate_determinant_2x2 ( v1.x, v1.y, v2.x, v2.y );

		for ( i = 1; i < nCount - 1; i++ )
		{
			v1 = v2;
			v2 = pVertices [ i + 1 ] - pVertices [ i ];
			fDeterminant = calculate_determinant_2x2 ( v1.x, v1.y, v2.x, v2.y );
			// we use the determinant to check direction from one point to another. A convex shape's points should only go around in one direction. The sign of the determinant determines that direction. If the sign of the determinant changes mid-way, then we have a concave shape.
			if ( fReferenceDeterminant * fDeterminant < 0.0f )
			{
				// if multiplying two determinants result to a negative value, we know that the sign of both numbers differ, hence it is concave
				return KD_FALSE;
			}
		}

		// check the last two vertices
		v1 = v2;
		v2 = pVertices [ 0 ] - pVertices [ nCount - 1 ];
		fDeterminant = calculate_determinant_2x2 ( v1.x, v1.y, v2.x, v2.y );
		if ( fReferenceDeterminant * fDeterminant < 0.0f )
		{
			return KD_FALSE;
		}

		// passed all tests
		return KD_TRUE;
		 */
	},
	
	/**
	 *	Creates a Box2D body for polygons that have been split
	 */
	createBodyWithPosition:function ( position, rotation, vertices, material )
	{
		/*
		b2BodyDef		tBodyDef;
		tBodyDef.type		= b2_dynamicBody;
		tBodyDef.position	= tPosition;
		tBodyDef.angle		= fRotation;

		b2Body*			pBody = m_pWorld->CreateBody ( &tBodyDef );

		b2FixtureDef	tFixtureDef;
		tFixtureDef.density		= fDensity;
		tFixtureDef.friction	= fFriction;
		tFixtureDef.restitution = fRestitution;

		b2PolygonShape	tShape;
		tShape.Set ( pVertices, nCount );
		tFixtureDef.shape = &tShape;
		pBody->CreateFixture ( &tFixtureDef );

		return pBody;
		*/
	},
	
	/**
	 *	Subtracts the life of the player and checks if the game should end
	 */
	subtractLife:function ( )
	{		
		this.lives--;
	
    	var		lost_life = new cc.Sprite ( "res/Images/x_filled.png" );
    	var		size  = lost_life.getContentSize ( );
    	lost_life.setPosition ( cc.p ( VisibleRect.right ( ).x - size.width / 2 - this.lives * size.width, VisibleRect.top ( ).y - size.height / 2 ) );
        this.addChild ( lost_life, 4 );
        
		cc.audioEngine.playEffect ( "res/Sounds/lose_life.wav" );
		
		// end the game if there are no more lives
		if ( this.lives <= 0 )
		{
			this.endGame ( );
		}
	},
	
	/**
	 *	Unschedules the update loop and shows a menu at the end of the game
	 */
	endGame:function ( )
	{
		this.unscheduleUpdate ( );
		
		var		label = new cc.MenuItemLabel ( new cc.LabelTTF ( "RESTART", "res/Fonts/Marker Felt.ttf", 50 ) , this.restart, this );
		label.setPosition ( VisibleRect.center ( ) );
		
		var		menu = new cc.Menu ( label );	
		menu.setPosition ( cc.p ( 0, 0 ) );
		this.addChild ( menu, 4 );	
	},
	
	restart:function ( sender )
	{
		var		scene = new cc.Scene ( );
		var		layer = new msw.Game ( );
		scene.addChild ( layer );
		cc.director.runScene ( scene );
	},
});
