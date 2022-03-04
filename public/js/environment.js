let myMesh;

function createEnvironment(scene) {
  console.log("Adding environment");

  // let texture = new THREE.TextureLoader().load("../assets/texture.png");
  // let myGeometry = new THREE.SphereGeometry(3, 12, 12);
  // let myMaterial = new THREE.MeshBasicMaterial({ map: texture });
  // myMesh = new THREE.Mesh(myGeometry, myMaterial);
  // myMesh.position.set(5, 2, 5);
  // scene.add(myMesh);

  const innerRadius = 3;
  const outerRadius = 15;
  const segments = 50;
  let myGeometry = new THREE.RingBufferGeometry(innerRadius, outerRadius, segments);
 // let myGeometry = new THREE.BoxGeometry(20, 0.5, 20);
  let myMaterial = new THREE.MeshNormalMaterial({side: THREE.DoubleSide});
  myRoof = new THREE.Mesh(myGeometry, myMaterial);
  myRoof.position.set(0, 5, -40);
  myRoof.rotation.x = Math.PI/2;
  scene.add(myRoof);
}


function updateEnvironment(scene) {
  // myMesh.position.x += 0.01;
}