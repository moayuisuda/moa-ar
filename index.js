// Create a marker root object to keep track of the marker.
//
function successFunc(stream) {
  var video = document.querySelector("video");
  // 旧的浏览器可能没有srcObject
  if ("srcObject" in video) {
    video.srcObject = stream;
  } else {
    // 防止在新的浏览器里使用它，应为它已经不再支持了
    video.src = window.URL.createObjectURL(stream);
  }
  video.onloadedmetadata = function (e) {
    video.play();

    var arController = new ARController(100, 100, "./data/camera_para.dat");

    arController.onload = function () {
      console.log("ARController ready for use", arController);

      let id;
      arController.loadMarker("./data/patt.hiro", function (markerId) {
        id = markerId;
      });

      var markerRoot = new THREE.Object3D();

      // Make the marker root matrix manually managed.
      //
      markerRoot.matrixAutoUpdate = false;

      // Add a getMarker event listener that keeps track of barcode marker with id 20.
      //
      arController.addEventListener("getMarker", function (ev) {
        if (ev.data.marker.idPatt === id) {
          // The marker was found in this video frame, make it visible.
          markerRoot.visible = true;
          console.log(markerRoot);

          // Copy the marker transformation matrix to the markerRoot matrix.
          markerRoot.matrix.set(ev.data.matrix);
        }
      });

      // Add a cube to the marker root.
      //
      markerRoot.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshNormalMaterial()));

      // Create renderer with a size that matches the video.
      //
      var renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(video.videoWidth, video.videoHeight);
      document.body.appendChild(renderer.domElement);

      // Set up the scene and camera.
      //
      var scene = new THREE.Scene();
      var camera = new THREE.Camera();
      scene.add(camera);
      scene.add(markerRoot);

      var light = new THREE.PointLight(0xffffff);
      light.position.set(40, 40, 40);
      scene.add(light);

      // Make the camera matrix manually managed.
      //
      camera.matrixAutoUpdate = false;

      // Set the camera matrix to the AR camera matrix.
      //
      console.log(JSON.stringify(camera.matrix));
      camera.matrix.set(arController.getCameraMatrix());
      console.log(JSON.stringify(camera.matrix));

      // On each frame, detect markers, update their positions and
      // render the frame on the renderer.
      //
      var tick = function () {
        requestAnimationFrame(tick);
 
        // Hide the marker, we don't know if it's visible in this frame.
        // markerRoot.visible = false;

        // Process detects markers in the video frame and sends
        // getMarker events to the event listeners.
        arController.process(video);

        // Render the updated scene.
        renderer.render(scene, camera);
      };
      tick();
    };
  };
}
function errorFunc(err) {
  alert(err.name);
}

if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function (constraints) {
    // 首先，如果有getUserMedia的话，就获得它
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // 一些浏览器根本没实现它 - 那么就返回一个error到promise的reject来保持一个统一的接口
    if (!getUserMedia) {
      return Promise.reject(new Error("getUserMedia is not implemented in this browser"));
    }

    // 否则，为老的navigator.getUserMedia方法包裹一个Promise
    return new Promise(function (resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  };
}

navigator.mediaDevices
  .getUserMedia({
		audio: true, 
		video: { facingMode: { exact: "environment" } }
  })
  .then(successFunc)
  .catch(function (err) {
    console.log(err.name + ": " + err.message);
  });
