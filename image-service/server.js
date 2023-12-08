const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const mysql = require('mysql2');
const cors = require('cors');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'wiljamniklas',
    database: process.env.DB_NAME || 'images',
});

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const processedImageBuffer = await processImage(req.file.buffer);
    await saveImageToDatabase(processedImageBuffer);
    res.json({ message: 'Image uploaded and processed successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/saveMergedImage', async (req, res) => {
  const { imageData, id } = req.body;

  try {
    // Process the merged image data as needed, e.g., save it to the database
    await createTableIfNotExists();

    const mergedImageBuffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    // If an ID is provided, update the existing image; otherwise, insert a new one
    if (id) {
      await updateImageInDatabase(id, mergedImageBuffer);
    } else {
      await saveImageToDatabase(mergedImageBuffer);
    }
    res.json({ message: 'Merged image saved successfully!' });
  } catch (error) {
    console.error('Error saving merged image to the database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/images', async (req, res) => {
  const query = 'SELECT * FROM images.image_data';

  try {
    connection.query(query, (err, rows) => {
      if (err) {
        console.error('Error fetching images from the database:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        const images = rows.map(row => ({ id: row.id, data: row.data.toString('base64') }));
          res.setHeader('Content-Type', 'application/json');
          res.json(images);
      }
    });
  } catch (error) {
    console.error('Error fetching images from the database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/images/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM images.image_data WHERE id = ?';  // Assuming your ID column is named 'id'

  try {
      connection.query(query, [id], (err, rows) => {
          if (err) {
              console.error('Error fetching image from the database:', err);
              if (!res.headersSent) {
                  res.status(500).json({ error: 'Internal server error' });
              }
          } else {
              if (rows.length === 0) {
                  res.status(404).json({ error: 'Image not found' });
              } else {
                  const image = {id: rows[0].id, data: rows[0].data.toString('base64') };
                  res.setHeader('Content-Type', 'application/json');
                  res.json(image);
              }
          }
      });
  } catch (error) {
      console.error('Error fetching image from the database:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

async function processImage(buffer) {
  const processedImageBuffer = await sharp(buffer)
    .resize(300, 300)
    .toBuffer();
  return processedImageBuffer;
}

async function createTableIfNotExists() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS image_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data MEDIUMBLOB
    )
  `;
  await connection.execute(createTableQuery);
}

async function updateImageInDatabase(id, imageBuffer) {
  try {
    const updateQuery = 'UPDATE image_data SET data = ? WHERE id = ?';
    await connection.execute(updateQuery, [imageBuffer, id]);

    console.log('Image data updated in the database');
  } catch (error) {
    console.error('Error updating image data in the database:', error);
    throw error;
  }
}

async function saveImageToDatabase(imageBuffer) {
  try {
    await createTableIfNotExists();

    const insertQuery = 'INSERT INTO image_data (data) VALUES (?)';
    await connection.execute(insertQuery, [imageBuffer]);

    console.log('Image data saved to the database');
  } catch (error) {
    console.error('Error saving image data to the database:', error);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});