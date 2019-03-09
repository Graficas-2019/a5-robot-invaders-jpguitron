var renderer = null, 
scene = null, 
root = null,
robot_idle = null,
robot_attack = null,
flamingo = null,
stork = null,
group = null

var deadAnimator;
var morphs = [];

var timeLimit = 60;

var duration = 20000; // ms
var currentTime = Date.now();
var currentTimeSpawn = Date.now(); 
var robot_mixer = {}

var robots = [];
var robot_mixers = [];
var robots_animations = [];
var speeds = [];
var score = 0;
//var robot_mixer = {};
var names = 0;
var clip;
var mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
var raycaster, camera;
var animation = "idle"
var game = false;
var gameStarted;
var gameMinutes = 0;
var robotsMax=6;
var robotsSpawned = 0;
var highScore = 0;

function changeAnimation(animation_text)
{
    animation = animation_text;

    if(animation =="dead")
    {
        createDeadAnimation();
    }
    else
    {
        robot_idle.rotation.x = 0;
        robot_idle.position.y = 0;
    }
}

//https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function getRandomInt(min, max) 
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createDeadAnimation()
{
    var xAxis = new THREE.Vector3( 0, 0, 1 );
    var qInitial = new THREE.Quaternion().setFromAxisAngle( xAxis, 0 );
    var qFinal = new THREE.Quaternion().setFromAxisAngle( xAxis, Math.PI/2 );

    var quaternionKF = new THREE.QuaternionKeyframeTrack( '.quaternion', [ 0, 1], [ qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.w] );

    clip = new THREE.AnimationClip( 'Die', 2,  [quaternionKF]);
}



function loadFBX()
{
    var loader = new THREE.FBXLoader();
    loader.load( './models/Robot/robot_idle.fbx', function ( object ) 
    {
        
        robot_mixer["idle"] = new THREE.AnimationMixer( scene );
        object.scale.set(0.02, 0.02, 0.02);
        //object.position.y -= 4;
        object.traverse( function ( child ) 
        {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        robot_idle = object;
        
        
        createDeadAnimation();

        robot_mixer["idle"].clipAction( object.animations[ 0 ], robot_idle ).play();
        robots_animations.push(object.animations[ 0 ]);

        loader.load( './models/Robot/robot_atk.fbx', function ( object ) 
        {
            robot_mixer["attack"] = new THREE.AnimationMixer( scene );
            robot_mixer["attack"].clipAction( object.animations[ 0 ], robot_idle ).play();
            robots_animations.push(object.animations[ 0 ]);
        } );

        loader.load( './models/Robot/robot_run.fbx', function ( object ) 
        {
            robot_mixer["run"] = new THREE.AnimationMixer( scene );
            robot_mixer["run"].clipAction( object.animations[ 0 ], robot_idle ).play();
            robots_animations.push(object.animations[ 0 ]);
        } );

        loader.load( './models/Robot/robot_walk.fbx', function ( object ) 
        {
            robot_mixer["walk"] = new THREE.AnimationMixer( scene );
            robot_mixer["walk"].clipAction( object.animations[ 0 ], robot_idle ).play();
            robots_animations.push(object.animations[ 0 ]);
        } );
    } );
}

function startGame()
{
    if(robots.length>0)
    {
        for(var actual = 0; actual<robots.length;actual++)
        {
            scene.remove(robots[actual]);
        }
        robots = [];
        robot_mixers = [];
        speeds = [];
        if(highScore<score)
        {
            highScore = score;
        }
        
        document.getElementById("highScore").innerHTML = "best score: " +highScore;
    }
    gameMinutes = 0
    gameStarted = Date.now();
    score = 0;
    names = 0;
    robotsSpawned = 0;
    document.getElementById("time").innerHTML = 60;
    document.getElementById("score").innerHTML = "score: " +score;
    document.getElementById("startButton").value = "Restart game";
    document.getElementById("startButton").disabled = true;
    

    game = true;
    
}

function animate() {

    var now = Date.now();
    var deltat = now - currentTime;
    var deltat3 = now - gameStarted;
    currentTime = now;

    if (robotsSpawned < robotsMax)
    {
        
        robotsSpawned++;
        currentTimeSpawn = now
        var x = getRandomInt(-72,72);
        
        var newRobot = cloneFbx(robot_idle);
        newRobot.position.set(x,-4,-100); 
        scene.add(newRobot);

        var mixer =  new THREE.AnimationMixer(newRobot);
        mixer.clipAction(robots_animations[2]).play();

        newRobot.name = names;
        newRobot.move = 0;
        newRobot.point = 1;
        newRobot.status = 1;

        
        
        robots.push(newRobot);
        robot_mixers.push(mixer);
        speeds.push((Math.random() * (0.02 - 0.04) + 0.04).toFixed(4));
        
        if(names==0)
        {
    
            scene.remove(robots[0]);
            robotsSpawned--;
        }
        names+=1;

    }

    if(deltat3>1000)
    {
        gameStarted = now;
        gameMinutes+=1;
        document.getElementById("time").innerHTML = 60-gameMinutes;
        console.log(robots);
        if(gameMinutes>=60)
        {
            document.getElementById("startButton").disabled = false;
            game=false;
        }
    }

    if (robots.length>0)
    {
        for(var actual = 0; actual<robots.length;actual++)
        {
            robot_mixers[actual].update(deltat * 0.001);
            
            if(robots[actual].status==1)
            {
                robots[actual].position.z += speeds[actual] * deltat;
            }
            else
            {
                if(robots[actual].point)
                {
                    score ++;
                    document.getElementById("score").innerHTML = "score: " +score;
                    robotsSpawned--;
                    robots[actual].point=0;
                }
                if(Date.now()-robots[actual].status>5000)
                {
                    
                    scene.remove(robots[actual]);
                }

            }

            if(robots[actual].position.z > 100 )
            {   
                if(robots[actual].point)
                {
                    score --;
                    robotsSpawned--;
                    scene.remove(robots[actual]);
                    document.getElementById("score").innerHTML = "score: " +score;
                    robots[actual].point=0;
                }
            }
                  
        }
    }

    if(animation =="dead")
    {
        KF.update();
    }
}

function onDocumentMouseDown(event)
{
    event.preventDefault();
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    // find intersections
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(scene.children, true);
    
    if ( intersects.length > 0 ) 
    {
        CLICKED = intersects[ 0 ].object;
        CLICKED.status = 0;
        if(CLICKED.parent.name!="")
        {
            robots[CLICKED.parent.name].status=Date.now();
            var attackAnimation = robot_mixers[CLICKED.parent.name].clipAction(robots_animations[1]).play();
            dieClip = robot_mixers[CLICKED.parent.name].clipAction(clip);

            //robots[actual].position.z


            dieClip.setLoop(THREE.LoopOnce);
            dieClip.clampWhenFinished = true;

            attackAnimation.play();
            dieClip.play();
        }
    } 

}

function onWindowResize() 
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function run() {
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render(scene, camera);

    // Spin the cube for next frame
    if(game)
    {
        animate();
    }
    
}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;
    
    light.color.setRGB(r, g, b);
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "./images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {
    
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(0, 150,120);
    camera.rotation.set(-45,0,0);


        
    // Create a group to hold all the objects
    root = new THREE.Object3D;
    
    spotLight = new THREE.SpotLight (0xffffff);
    spotLight.position.set(0, 80, 0);
    spotLight.target.position.set(0, 0, 0);
    root.add(spotLight);

    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.camera.fov = 45;
    
    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    //ambientLight = new THREE.AmbientLight ( 0x888888 );
    //root.add(ambientLight);
    
    // Create the objects
    loadFBX();
    
    
    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;
    
    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;
    
    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    raycaster = new THREE.Raycaster();
    // Now add the group to our scene
    scene.add( root );

    document.addEventListener('mousedown', onDocumentMouseDown);
    window.addEventListener( 'resize', onWindowResize);

}