import MainLayout from '@/components/layout/MainLayout';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="inline-block p-3 rounded-full bg-accent/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">About This Research</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Understanding the cognitive processes that underlie human behavior and mental function
          </p>
        </div>
        
        <div className="bg-card p-8 rounded-lg shadow-md border border-border">
          <div className="prose max-w-none">
            <p>
              This platform hosts a series of psychological tests designed to measure various cognitive functions.
              The data collected will be used for psychological research purposes.
            </p>
            
            <h2 className="text-2xl font-semibold mt-10 mb-6 flex items-center">
              <span className="bg-primary/10 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
              The Tests
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
                  The Stroop Test measures cognitive interference - the delay in reaction time when the brain must process
                  conflicting information. Participants are shown color words (like "RED") printed in different colored ink,
                  and must name the ink color rather than read the word.
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
              Data Privacy
            </h2>
            <div className="bg-muted/50 p-6 rounded-lg border border-border">
              <p className="text-muted-foreground">
                All data collected through this platform is anonymized and stored securely. Your personal information
                will not be shared with any third parties. The results of this research may be published in academic
                journals or presented at conferences, but no identifying information will be included.
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
              <p>
                If you have any questions or concerns about this research, please contact the research team at:
              </p>
              <a href="mailto:research@psycotest.example.com" className="inline-flex items-center mt-2 text-accent hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                research@psycotest.example.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 