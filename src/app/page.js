import MainLayout from '@/components/layout/MainLayout';
import RegistrationForm from '@/components/forms/RegistrationForm';
import Link from 'next/link';

export default function Home() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-16">
          <div className="inline-block p-3 rounded-full bg-primary/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">Psychological Research Tests</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Participate in our psychological research by completing a series of cognitive tests designed to measure various mental processes.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-10 mb-12">
          <div>
            <div className="bg-card p-6 rounded-lg shadow-md border border-border h-full">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <span className="bg-secondary/10 p-1.5 rounded-md mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                About This Study
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>
                  This research involves completing several standard psychological tests:
                </p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-start">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span><strong className="text-foreground">Stroop Test</strong> - measures cognitive interference</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span><strong className="text-foreground">Trail-Making Test</strong> - assesses visual attention and task switching</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span><strong className="text-foreground">Corsi Blocks Test</strong> - measures visual-spatial short-term working memory</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary/10 p-1 rounded-full mr-2 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span><strong className="text-foreground">Five-Points Test</strong> - evaluates figural fluency</span>
                  </li>
                </ul>
                <p className="mt-6 border-t border-border pt-4">
                  Your participation is voluntary and your data will be kept confidential.
                  Each participant may only complete the tests once.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <span className="bg-accent/10 p-1.5 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </span>
              Registration
            </h2>
            <p className="mb-6 text-muted-foreground">
              Please complete the registration form below to participate in the study.
            </p>
            <RegistrationForm />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
