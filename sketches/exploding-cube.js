const { lerp, linspace } = require('canvas-sketch-util/math');
const { range } = require('canvas-sketch-util/random');
const THREE = require('three');

global.THREE = THREE;

require('three/examples/js/controls/OrbitControls');

const canvasSketch = require('canvas-sketch');

const frustumSize = 200;

let material;

const jitter = 4;

const subdivide = ({ x, y }, width, height, group, depth = 0) => {
  if (width < jitter * 2 || height < jitter * 2) {
    const mesh = new THREE.Mesh(
      new THREE.BoxBufferGeometry(width, height, 10),
      material
    );
    mesh.geometry.translate(x, y, 0);
    mesh.userData = { offset: range(-10, 20) };
    group.add(mesh);
    return;
  }

  let first;
  let second;
  if (height <= width) {
    // vertical
    const splitAt = range(width / 2 - jitter, width / 2 + jitter);
    first = {
      x: x + -width / 2 + splitAt / 2,
      y,
      width: splitAt,
      height,
    };
    second = {
      x: x + splitAt / 2,
      y,
      width: width - splitAt,
      height,
    };
  } else {
    // horizontal
    const splitAt = range(height / 2 - jitter, height / 2 + jitter);
    first = {
      x,
      y: y + -height / 2 + splitAt / 2,
      width,
      height: splitAt,
    };
    second = {
      x,
      y: y + splitAt / 2,
      width,
      height: height - splitAt,
    };
  }

  subdivide(
    { x: first.x, y: first.y },
    first.width,
    first.height,
    group,
    depth + 1
  );

  subdivide(
    { x: second.x, y: second.y },
    second.width,
    second.height,
    group,
    depth + 1
  );
};

const sketch = ({ context, height, width }) => {
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });
  renderer.setClearColor('#EEE', 1);
  const scene = new THREE.Scene();

  const aspect = width / height;
  const camera = new THREE.OrthographicCamera(
    -frustumSize * aspect,
    frustumSize * aspect,
    frustumSize,
    -frustumSize,
    -1000,
    1000
  );
  camera.position.set(50, 50, 100);
  scene.add(camera);

  const controls = new THREE.OrbitControls(camera, context.canvas);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(200, 500, 100);
  light.target.position.set(0, 0, 0);
  camera.add(light);
  camera.add(light.target);

  material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.0
  });

  const sides = linspace(6).map(() => {
    const side = new THREE.Group();
    subdivide({ x: 0, y: 0 }, 150, 150, side);
    scene.add(side);
    return side;
  });

  sides[0].translateZ(70);
  sides[1].translateZ(-70);

  sides[2].rotateY(Math.PI / 2);
  sides[2].translateZ(70);

  sides[3].rotateY(Math.PI / 2);
  sides[3].translateZ(-70);

  sides[4].rotateX(Math.PI / 2);
  sides[4].translateZ(-70);

  sides[5].rotateX(Math.PI / 2);
  sides[5].translateZ(70);

  let inc = 0;
  let downtime = 0;
  let animating = true;
  window.addEventListener('pointerdown', () => {
    downtime = Date.now();
  });
  window.addEventListener('pointerup', () => {
    const elapsed = Date.now() - downtime;
    if (elapsed < 250) {
      animating = !animating;
    }
    downtime = 0;
  });

  return {
    resize({ viewportWidth, viewportHeight }) {
      const newAspect = viewportWidth / viewportHeight;
      camera.left = -frustumSize * newAspect;
      camera.right = frustumSize * newAspect;
      camera.top = frustumSize;
      camera.bottom = -frustumSize;

      camera.updateProjectionMatrix();

      renderer.setSize(viewportWidth, viewportHeight);
    },

    render() {
      if (inc > Math.PI) {
        const translate = Math.sin((inc - Math.PI) / 6) * 2 + 1;
        for (let i = 0; i < 6; i++) {
          const cubes = sides[i].children;
          for (let j = 0; j < cubes.length; j++) {
            cubes[j].position.z = lerp(-cubes[j].userData.offset, 0, translate);
          }
        }
      }
      if (animating) {
        inc += 1 / 16;
      }
      controls.update();
      renderer.render(scene, camera);
    },

    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, {
  animate: true,
  context: 'webgl',
});
