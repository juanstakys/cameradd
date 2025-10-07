const { withAppBuildGradle, withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MLKIT_DEP = 'implementation("com.google.mlkit:text-recognition:16.0.0")';

function ensureMlkitDependency(appBuildGradle) {
  if (appBuildGradle.includes('com.google.mlkit:text-recognition')) return appBuildGradle;
  return appBuildGradle.replace(/dependencies\s*\{/m, (m) => `${m}\n    ${MLKIT_DEP}\n`);
}

const withMlkitGradle = (config) =>
  withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = ensureMlkitDependency(cfg.modResults.contents);
    return cfg;
  });

const withKotlinFrameProcessor = (config) =>
  withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) return cfg;
      const srcDir = path.join(
        cfg.modRequest.projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        ...pkg.split('.'),
        'ocr'
      );
      fs.mkdirSync(srcDir, { recursive: true });
      const fpPath = path.join(srcDir, 'RecognizeNumbersFrameProcessor.kt');
      const kotlinFP = `package ${pkg}.ocr

import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.google.mlkit.vision.common.InputImage
import com.google.android.gms.tasks.Tasks

class RecognizeNumbersFrameProcessor : FrameProcessorPlugin() {
  companion object {
    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
  }

  override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val mediaImage = frame.getImage()
    val rotation = frame.getImageProxy().getImageInfo().getRotationDegrees()
    val image = InputImage.fromMediaImage(mediaImage, rotation)
    val text = Tasks.await(recognizer.process(image))

    val arr = WritableNativeArray()
    for (block in text.textBlocks) {
      for (line in block.lines) {
        for (element in line.elements) {
          val t = element.text ?: ""
          if (t.isEmpty()) continue
          val map = WritableNativeMap()
          map.putString("text", t)
          val bb = element.boundingBox
          if (bb != null) {
            val box = WritableNativeMap()
            box.putDouble("x", bb.left.toDouble())
            box.putDouble("y", bb.top.toDouble())
            box.putDouble("width", (bb.right - bb.left).toDouble())
            box.putDouble("height", (bb.bottom - bb.top).toDouble())
            map.putMap("box", box)
          }
          arr.pushMap(map)
        }
      }
    }
    return arr
  }
}
`;
      fs.writeFileSync(fpPath, kotlinFP);

      const installerPath = path.join(srcDir, 'RecognizeNumbersInstaller.kt');
      const kotlinInstaller = `package ${pkg}.ocr

import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

object RecognizeNumbersInstaller {
  @JvmStatic fun install() {
    FrameProcessorPluginRegistry.addFrameProcessorPlugin("recognizeNumbers") { _, _ ->
      RecognizeNumbersFrameProcessor()
    }
  }
}
`;
      fs.writeFileSync(installerPath, kotlinInstaller);
      return cfg;
    },
  ]);

const withRegisterInMainApplication = (config) =>
  withMainApplication(config, (cfg) => {
    const pkg = cfg.android?.package;
    if (!pkg) return cfg;
    const file = cfg.modResults;
    let contents = file.contents;
    // Ensure import
    if (!contents.includes(`${pkg}.ocr.RecognizeNumbersInstaller`)) {
      contents = contents.replace(
        /(package\s+[\w\.]+;[\s\S]*?import[\s\S]*?;)/,
        (m) => `${m}\nimport ${pkg}.ocr.RecognizeNumbersInstaller;`
      );
    }
    // Ensure call in onCreate()
    contents = contents.replace(
      /(super\.onCreate\(\);)/,
      (m) => `${m}\n    RecognizeNumbersInstaller.install();`
    );
    file.contents = contents;
    return cfg;
  });

module.exports = function withMlkitOcr(config) {
  config = withMlkitGradle(config);
  config = withKotlinFrameProcessor(config);
  config = withRegisterInMainApplication(config);
  return config;
};
