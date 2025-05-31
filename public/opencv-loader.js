cat > public/opencv-loader.js << 'EOF'
// OpenCV.js loader
window.loadOpenCV = function() {
  return new Promise((resolve, reject) => {
    if (window.cv) {
      resolve(window.cv);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    
    script.onload = () => {
      const checkCV = () => {
        if (window.cv && window.cv.Mat) {
          resolve(window.cv);
        } else {
          setTimeout(checkCV, 100);
        }
      };
      checkCV();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load OpenCV.js'));
    };
    
    document.head.appendChild(script);
  });
};
EOF

# 11. Update index.html to include OpenCV loader
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="NeuroExam App - Your Twin Avatar Project Companion"
    />
    <title>NeuroExam App</title>
    <script src="%PUBLIC_URL%/opencv-loader.js"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF