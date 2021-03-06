/*
 *
 * This uses code from a THREE.js Multiplayer boilerplate made by Or Fleisher:
 * https://github.com/juniorxsound/THREE.Multiplayer
 * Aidan Nelson, April 2020
 *
 */


class Scene {
  constructor() {
    //THREE scene
    this.scene = new THREE.Scene();
    
    

    //Utility
    this.width = window.innerWidth;
    this.height = window.innerHeight * 0.9;

    // lerp value to be used when interpolating positions and rotations
    this.lerpValue = 0;

    //THREE Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      0.1,
      5000
    );
    this.camera.position.set(0, 3, 6);
    this.scene.add(this.camera);

    // create an AudioListener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    //THREE WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialiasing: true,
    });
    

    // add controls:
    this.controls = new FirstPersonControls(this.scene, this.camera, this.renderer);

    //Push the canvas to the DOM
    let domElement = document.getElementById("canvas-container");
    domElement.append(this.renderer.domElement);

    //Setup event listeners for events and handle the states
    window.addEventListener("resize", (e) => this.onWindowResize(e), false);

    // Helpers
    //this.scene.add(new THREE.GridHelper(500, 500));
   // this.scene.add(new THREE.AxesHelper(10));


    // this.renderer.setClearColor(new THREE.Color("lightblue"));
     this.renderer.setSize(this.width, this.height);
     this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // SKY
    this.sun = new THREE.Vector3();
    this.sky = new THREE.Sky();
    this.addSky();
    this.updateSun();


    // WATER
    this.water = new THREE.Water();
    this.addWater();


   // this.addLights();
    createEnvironment(this.scene);

    // Start the loop
    this.frameCount = 0;
    this.update();
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Lighting ????

  addLights() {
    //this.scene.add(new THREE.AmbientLight(0xffffe6, 0.7));
  }

  addSky(){
    // const sky = new THREE.Sky();
    this.sky.scale.setScalar( 1000 );
    
    const skyUniforms = this.sky.material.uniforms;

				// skyUniforms[ 'turbidity' ].value = 10;
				// skyUniforms[ 'rayleigh' ].value = 2;
				// skyUniforms[ 'mieCoefficient' ].value = 0.005;
				// skyUniforms[ 'mieDirectionalG' ].value = 0.8;

        skyUniforms[ 'turbidity' ].value = 0.6;
				skyUniforms[ 'rayleigh' ].value = 6;
				skyUniforms[ 'mieCoefficient' ].value = 0.009;
				skyUniforms[ 'mieDirectionalG' ].value = 0.988;

         
    this.scene.add( this.sky ); 
  }
  

  updateSun() {
    const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
    const parameters = {
      // elevation: 2,
      // azimuth: 180

      elevation: 1,
      azimuth: 180
    };

    const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
    var theta = THREE.MathUtils.degToRad( parameters.azimuth );

    this.sun.setFromSphericalCoords( 1, phi, theta );

    this.sky.material.uniforms[ 'sunPosition' ].value.copy( this.sun );
  //  this.water.material.uniforms[ 'sunDirection' ].value.copy( this.sun ).normalize();

    this.scene.environment = pmremGenerator.fromScene( this.sky ).texture;
  }

  addWater(){

    const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
     this.water = new THREE.Water(
      waterGeometry,
      {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load( 'assets/waternormals.jpg', function ( texture ) {

          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        } ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: this.scene.fog !== undefined
      }
    );
    this.water.material.uniforms[ 'sunDirection' ].value.copy( this.sun ).normalize();
    this.water.rotation.x = - Math.PI / 2;

    this.scene.add( this.water );

  }

				

  

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Clients ????

  // add a client meshes, a video element and  canvas for three.js video texture
  addClient(id) {
    let videoMaterial = makeVideoMaterial(id);
    let otherMat = new THREE.MeshNormalMaterial();

    let head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [otherMat,otherMat,otherMat,otherMat,otherMat,videoMaterial]);

    // set position of head before adding to parent object
    head.position.set(0, 0, 0);

    // https://threejs.org/docs/index.html#api/en/objects/Group
    var group = new THREE.Group();
    group.add(head);

    // add group to scene
    this.scene.add(group);

    peers[id].group = group;
    
    peers[id].previousPosition = new THREE.Vector3();
    peers[id].previousRotation = new THREE.Quaternion();
    peers[id].desiredPosition = new THREE.Vector3();
    peers[id].desiredRotation = new THREE.Quaternion();
  }

  removeClient(id) {
    this.scene.remove(peers[id].group);
  }

  // overloaded function can deal with new info or not
  updateClientPositions(clientProperties) {
    this.lerpValue = 0;
    for (let id in clientProperties) {
      if (id != mySocket.id) {
        peers[id].previousPosition.copy(peers[id].group.position);
        peers[id].previousRotation.copy(peers[id].group.quaternion);
        peers[id].desiredPosition = new THREE.Vector3().fromArray(
          clientProperties[id].position
        );
        peers[id].desiredRotation = new THREE.Quaternion().fromArray(
          clientProperties[id].rotation
        );
      }
    }
  }

  interpolatePositions() {
    this.lerpValue += 0.1; // updates are sent roughly every 1/5 second == 10 frames
    for (let id in peers) {
      if (peers[id].group) {
        peers[id].group.position.lerpVectors(peers[id].previousPosition,peers[id].desiredPosition, this.lerpValue);
        peers[id].group.quaternion.slerpQuaternions(peers[id].previousRotation,peers[id].desiredRotation, this.lerpValue);
      }
    }
  }

  updateClientVolumes() {
    for (let id in peers) {
      let audioEl = document.getElementById(id + "_audio");
      if (audioEl && peers[id].group) {
        let distSquared = this.camera.position.distanceToSquared(
          peers[id].group.position
        );

        if (distSquared > 500) {
          audioEl.volume = 0;
        } else {
          // from lucasio here: https://discourse.threejs.org/t/positionalaudio-setmediastreamsource-with-webrtc-question-not-hearing-any-sound/14301/29
          let volume = Math.min(1, 10 / distSquared);
          audioEl.volume = volume;
        }
      }
    }
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Interaction ?????????????

  getPlayerPosition() {
    // TODO: use quaternion or are euler angles fine here?
    return [
      [
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z,
      ],
      [
        this.camera.quaternion._x,
        this.camera.quaternion._y,
        this.camera.quaternion._z,
        this.camera.quaternion._w,
      ],
    ];
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Rendering ????

  update() {
    requestAnimationFrame(() => this.update());
    this.frameCount++;

    updateEnvironment();

    if (this.frameCount % 25 === 0) {
      this.updateClientVolumes();
    }

    this.interpolatePositions();
    this.controls.update();
    this.render();
  }

  render() {

    this.water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

    //this.parameters.azimuth += 5;


    this.renderer.render(this.scene, this.camera);

  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Event Handlers ????

  onWindowResize(e) {
    this.width = window.innerWidth;
    this.height = Math.floor(window.innerHeight * 0.9);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// Utilities

function makeVideoMaterial(id) {
  let videoElement = document.getElementById(id + "_video");
  let videoTexture = new THREE.VideoTexture(videoElement);

  let videoMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    overdraw: true,
    side: THREE.DoubleSide,
  });

  return videoMaterial;
}
