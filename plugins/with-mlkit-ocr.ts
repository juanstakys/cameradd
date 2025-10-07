import { ConfigPlugin, withAppBuildGradle, withDangerousMod } from '@expo/config-plugins';
import fs from 'fs';
import path from 'path';

const MLKIT_DEP = 'implementation("com.google.mlkit:text-recognition:16.0.0")';

function ensureMlkitDependency(appBuildGradle: string): string {
  if (appBuildGradle.includes('com.google.mlkit:text-recognition')) return appBuildGradle;
  // naive inject into dependencies { }
  return appBuildGradle.replace(/dependencies\s*\{/m, (m) => `${m}\n    ${MLKIT_DEP}\n`);
}

const withMlkitGradle: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = ensureMlkitDependency(cfg.modResults.contents);
    return cfg;
  });
};

const withKotlinFrameProcessor: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const pkg = cfg.android?.package;
      if (!pkg) {
        // No package: nothing to write.
        return cfg;
      }
      const srcDir = path.join(cfg.modRequest.projectRoot, 'android', 'app', 'src', 'main', 'java', ...pkg.split('.'), 'ocr');
      fs.mkdirSync(srcDir, { recursive: true });
      const filePath = path.join(srcDir, 'RecognizeNumbersFrameProcessor.kt');
      const kotlin = `package ${pkg}.ocr

import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.bridge.ReadableMap
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.google.mlkit.vision.common.InputImage
import com.google.android.gms.tasks.Tasks

class RecognizeNumbersFrameProcessor: FrameProcessorPlugin("recognizeNumbers") {
  companion object {
    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
  }

  override fun callback(frame: Frame, params: ReadableMap?): Any? {
    val imageProxy = frame.image ?: return null
    val mediaImage = imageProxy.image ?: return null
    val rotation = imageProxy.imageInfo.rotationDegrees
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
      fs.writeFileSync(filePath, kotlin);
      return cfg;
    },
  ]);
};

const withMlkitOcr: ConfigPlugin = (config) => {
  config = withMlkitGradle(config);
  config = withKotlinFrameProcessor(config);
  return config;
};

export default withMlkitOcr;

