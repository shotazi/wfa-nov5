import express from 'express';
import cors from 'cors';
import { createServer } from 'vite';
import { YoutubeTranscript } from 'youtube-transcript';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint to fetch YouTube transcript
app.get('/api/transcript/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    
    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!transcript) {
      return res.status(404).json({ error: 'No transcript content found' });
    }

    res.json({ transcript });
  } catch (error) {
    console.error('Transcript error:', error);
    if (error.message?.includes('Could not get transcripts')) {
      return res.status(404).json({
        error: 'No transcript available for this video. The video might be private, unavailable, or transcripts are disabled.'
      });
    }
    res.status(500).json({ error: 'Failed to fetch transcript. Please check the URL and try again.' });
  }
});

// Create Vite server
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

// Use Vite's middleware
app.use(vite.middlewares);

const port = 5173;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});