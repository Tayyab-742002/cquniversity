'use client';

export default function AboutPage() {
  const downloadPDF = () => {
   
    const pdfUrl = '/information_sheet.pdf';
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'information_sheet.pdf';
    link.click();
  };

  return (
   
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="inline-block p-3 rounded-full bg-accent/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">About This Research</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Understanding the relationship between cognition, personality, emotions and athletic development
          </p>
        </div>
        
        <div className="bg-card p-8 rounded-lg shadow-md border border-border mb-8">
          <div className="prose max-w-none">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold flex items-center">
                <span className="bg-primary/10 p-1.5 rounded-md mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                Research Study Information
              </h2>
              <button
                onClick={downloadPDF}
                className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors flex items-center text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Info Sheet
              </button>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">
                DO COGNITION, PERSONALITY AND EMOTIONS PREDICT ATHLETES' DEVELOPMENT AND SPORTS PERFORMANCE?
              </h3>
              <p className="text-blue-700 mb-2"><strong>Researchers:</strong> Dr. Alberto Filgueiras</p>
              <p className="text-blue-700 mb-4"><strong>Institution:</strong> Central Queensland University, Cairns, QLD (CQUniversity, Australia)</p>
              
              <p className="text-blue-700">
                The aim of this research is to investigate any potential relationships between cognition, personality, 
                behavioural regulation and sport skills development. We are going to utilise data from participants to 
                correlate psychological dimensions and sport-related outcomes in the attempt to understand how psychological 
                variables relate to sports.
              </p>
            </div>

            <h4 className="text-lg font-semibold mb-3 text-gray-800">What will I be asked to do?</h4>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 mb-3">
                We are asking children and teenagers aged <strong>12 to 18 who practice sports regularly</strong> to help us.
              </p>
              <p className="text-gray-700 mb-3">
                The baseline data collection will happen once a year and includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
                <li>Five questionnaires (social/personal info, Perceived Stress Scale, Sport Anxiety Scale-2, Motivational Climate Scale, NEO-FF Inventory)</li>
                <li>Four cognitive tasks (Digital Span, Corsi Blocks, Stroop Test, 5-point test)</li>
              </ul>
            </div>

            <h4 className="text-lg font-semibold mb-3 text-gray-800">Are there benefits or risks?</h4>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
              <p className="text-amber-800 mb-2">
                Research on personality, cognitive and emotional outcomes has been conducted worldwide with no known negative 
                effects beyond the natural experience of answering questionnaires or focusing on tasks.
              </p>
              <p className="text-amber-800 mb-2">
                Some topics, particularly stress and anxiety, may be sensitive. If you feel any negative effects, 
                support services are available and you can stop participating at any time.
              </p>
              <div className="bg-amber-100 p-3 rounded border border-amber-300 mt-3">
                <p className="text-amber-900 text-sm">
                  <strong>Support:</strong> Kids helpline (1800 55 1800, https://kidshelpline.com.au/) 
                  or www.childhelplineinternational.org for international contacts.
                </p>
              </div>
            </div>

            <h4 className="text-lg font-semibold mb-3 text-gray-800">Should I participate?</h4>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
              <p className="text-green-700 mb-2">
                It is your choice whether you would like to take part – it's ok to say no. Before you make a decision, 
                you can talk to your parents or carer, a teacher or trusted adult at school.
              </p>
              <p className="text-green-700">
                You are free to change your mind and can stop at any time. Your parents or carer will also need to 
                confirm your participation online.
              </p>
            </div>

            <h4 className="text-lg font-semibold mb-3 text-gray-800">What will happen with my responses?</h4>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6">
              <p className="text-purple-700 mb-2">
                All responses will be combined and discussed as a total - you will not be identifiable in any way. 
                We will delete any information that could identify you, like your name, IP or email address.
              </p>
              <p className="text-purple-700">
                Data will be completely anonymised and may be used in future research projects and shared with other 
                researchers, but they will not know who you are.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-md border border-border">
          <div className="prose max-w-none">            
            <h2 className="text-2xl font-semibold mt-0 mb-6 flex items-center">
              <span className="bg-primary/10 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              The Cognitive Tests
            </h2>
            
            <div className="space-y-8 mt-6">
              <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-secondary/10 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </span>
                  Stroop Test
                </h3>
                <p className="text-muted-foreground">
                  The Stroop Test measures cognitive interference and selective attention. Participants respond to arrow 
                  directions (left, right, up, down) while ignoring their position on screen. This test measures 
                  cognitive flexibility and the ability to suppress automatic responses.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-secondary/10 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </span>
                  Trail-Making Test
                </h3>
                <p className="text-muted-foreground">
                  The Trail-Making Test assesses visual attention and task switching. Participants connect a series of dots
                  in numerical order (Part A) or alternating between numbers and letters (Part B). This test measures
                  executive function, specifically the ability to switch between different tasks.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-secondary/10 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </span>
                  Corsi Blocks Test
                </h3>
                <p className="text-muted-foreground">
                  The Corsi Blocks Test measures visual-spatial short-term working memory. Participants are shown a series
                  of blocks that light up in a specific sequence, and must then reproduce that sequence. The test increases
                  in difficulty as more blocks are added to the sequence.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="bg-secondary/10 p-1.5 rounded-md mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                  </span>
                  Five-Points Test
                </h3>
                <p className="text-muted-foreground">
                  The Five-Points Test evaluates figural fluency and creativity. Participants are presented with a grid of
                  dots and must create as many unique designs as possible by connecting the dots with straight lines within
                  a time limit.
                </p>
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold mt-10 mb-6 flex items-center">
              <span className="bg-primary/10 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              Data Privacy & Ethics
            </h2>
            <div className="bg-muted/50 p-6 rounded-lg border border-border">
              <p className="text-muted-foreground mb-3">
                All data collected through this platform is anonymized and stored securely. Your personal information
                will not be shared with any third parties. The results of this research may be published in academic
                journals or presented at conferences, but no identifying information will be included.
              </p>
              <p className="text-muted-foreground">
                This research has been approved by the CQUniversity Human Research Ethics Committee. 
                If you have concerns about how the research is being conducted, you can contact the Ethics Officer 
                at ethics@cqu.edu.au or +61 07 4923 2603.
              </p>
            </div>
            
            <h2 className="text-2xl font-semibold mt-10 mb-6 flex items-center">
              <span className="bg-primary/10 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              Contact Information
            </h2>
            <div className="bg-accent/5 p-6 rounded-lg border border-border">
              <p className="mb-4">
                If you have any questions or concerns about this research, please contact:
              </p>
              <div className="space-y-2">
                <div>
                  <strong>Principal Researcher:</strong> Dr. Alberto Filgueiras
                </div>
                <a href="mailto:a.filgueirasgoncalves@cqu.edu.au" className="inline-flex items-center text-accent hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  a.filgueirasgoncalves@cqu.edu.au
                </a>
                <div>
                  <strong>Phone:</strong> +61 7 4930 9000
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
} 