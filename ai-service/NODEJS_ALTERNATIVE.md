# 🤖 Exemplo de Implementação Node.js (Alternativa)

## Setuparquive npm e dependências:

```json
{
  "name": "ai-service-nodejs",
  "version": "1.0.0",
  "description": "Background removal service using Node.js and TensorFlow.js",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@tensorflow/tfjs-node-gpu": "^4.15.0",
    "@mediapipe/selfie_segmentation": "^0.1.1675465747",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.32.6",
    "cors": "^2.8.5",
    "helmet": "^7.1.0"
  }
}
```

## Exemplo de implementação básica:

```javascript
const express = require('express');
const tf = require('@tensorflow/tfjs-node-gpu');
const { SelfieSegmentation } = require('@mediapipe/selfie_segmentation');
const multer = require('multer');
const sharp = require('sharp');

const app = express();
let model = null;

// Initialize model
async function initModel() {
  console.log('🤖 Loading TensorFlow.js model...');
  
  // Option 1: Load pre-trained DeepLab model
  model = await tf.loadLayersModel('https://tfhub.dev/tensorflow/deeplabv3/1');
  
  // Option 2: Use MediaPipe Selfie Segmentation
  // const selfieSegmentation = new SelfieSegmentation({locateFile: (file) => {
  //   return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
  // }});
  
  console.log('✅ Model loaded successfully!');
}

// Background removal endpoint
app.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    
    // Process with Sharp
    const image = sharp(imageBuffer);
    const { width, height, channels } = await image.metadata();
    
    // Convert to tensor
    const imageArray = await image
      .resize(513, 513) // DeepLab input size
      .raw()
      .toBuffer();
    
    const tensor = tf.tensor4d(imageArray, [1, 513, 513, 3]);
    
    // Run inference
    const prediction = model.predict(tensor);
    const mask = prediction.dataSync();
    
    // Apply mask to original image
    const processedImage = await applyMask(imageBuffer, mask, width, height);
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="processed.png"'
    });
    
    res.send(processedImage);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

async function applyMask(imageBuffer, mask, width, height) {
  // Apply segmentation mask to remove background
  // Implementation details...
  return processedBuffer;
}
```

## Vantagens da Implementação Node.js:
✅ **Stack Unificado**: Mesma linguagem que o backend principal  
✅ **Deploy Simplificado**: Pode rodar no mesmo container  
✅ **Integração Nativa**: Sem comunicação HTTP entre serviços  
✅ **Real-time Processing**: WebRTC streams, WebSocket support  

## Limitações:
❌ **Performance**: Inferior ao Python para ML  
❌ **Modelos Limitados**: Menos opções pré-treinadas  
❌ **Memory Usage**: Maior uso de memória para grandes imagens  
❌ **GPU Support**: Mais complexo de configurar  

---

# 🚀 Implementação Recomendada Final

## Para Começar Rapidamente: **Python + rembg**
```bash
# Setup em 5 minutos
cd ai-service/
pip install -r requirements.txt
python app.py
```

## Para Produção Escalável: **Python + FastAPI + Docker**
```bash
# Build e run com Docker
docker-compose up --build
```

## Para Stack Unificado: **Node.js + TensorFlow.js**
```bash
# Implementação JavaScript completa
npm install
npm start
```

---

A implementação Python com **rembg** oferece a melhor relação custo-benefício para começar, com possibilidade de evolução para modelos customizados conforme a necessidade do projeto cresce.