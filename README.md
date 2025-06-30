# PsycoTest - Psychological Research Platform

A web application for conducting psychological tests for research purposes. This platform allows participants to complete standard psychological tests including the Stroop Test, Trail-Making Test, Corsi Blocks Test, and Five-Points Test.

## Features

- Participant registration with IP address tracking to prevent duplicate submissions
- Four standard psychological tests:
  - Stroop Test
  - Trail-Making Test
  - Corsi Blocks Test
  - Five-Points Test
- MongoDB integration for data storage
- JsPsych integration for psychological test implementation

## Getting Started

### Prerequisites

- Node.js 18.x or later
- MongoDB instance (local or cloud-based)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/psycotest.git
   cd psycotest
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following content:
   ```
   MONGODB_URI=mongodb://localhost:27017/psycotest
   ```
   Replace the URI with your MongoDB connection string.

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
psycotest/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API routes
│   │   ├── tests/           # Test pages
│   │   ├── about/           # About page
│   │   ├── page.js          # Home page
│   │   └── layout.js        # Root layout
│   ├── components/          # React components
│   │   ├── forms/           # Form components
│   │   ├── layout/          # Layout components
│   │   └── tests/           # Test-specific components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Library code
│   │   └── mongodb/         # MongoDB connection
│   ├── models/              # Mongoose models
│   ├── styles/              # CSS styles
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── ...config files
```

## Embedding in Qualtrics

To embed these tests in Qualtrics:

1. Use the Qualtrics JavaScript Editor to add an iframe pointing to this application
2. Pass participant information via URL parameters
3. Configure the application to send results back to Qualtrics

Example Qualtrics JavaScript:
```javascript
Qualtrics.SurveyEngine.addOnload(function() {
  var container = document.querySelector('.QuestionBody');
  var iframe = document.createElement('iframe');
  iframe.src = 'https://your-app-url.com/tests/stroop?participantId=${e://Field/participantId}';
  iframe.style.width = '100%';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  container.appendChild(iframe);
});
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- JsPsych library for psychological test implementation
- Next.js and React for the frontend framework
- MongoDB for data storage
