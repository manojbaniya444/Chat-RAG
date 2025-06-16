import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import PdfUpload from "@/components/pdf/pdf-upload";
import { getChatsAction } from "@/lib/actions/chat.actions";

// Loading component for the upload section
function UploadSectionLoading() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center rounded-lg">
          <div className="animate-pulse">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Header component for the chat page
function ChatHeader() {
  return (
    <header className="w-full p-4 flex justify-between items-center border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="border border-gray-300 hover:bg-gray-50 p-2 rounded-lg cursor-pointer transition-colors" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Upload PDF</h1>
          <p className="text-sm text-gray-600">Start a new conversation with your document</p>
        </div>
      </div>
    </header>
  );
}

// Server component for the main chat page
export default async function ChatRootPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Prefetch user's chats (this will be cached)
  await getChatsAction();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ChatHeader />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Upload Your PDF Document
            </h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Upload a PDF document to start an intelligent conversation. 
              Ask questions, get summaries, and extract insights.
            </p>
          </div>

          {/* Upload Component */}
          <Suspense fallback={<UploadSectionLoading />}>
            <PdfUpload />
          </Suspense>

          {/* Features Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Analysis</h3>
              <p className="text-sm text-gray-600">
                AI-powered analysis of your document content
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-8 8a9.863 9.863 0 01-4.255-.949L5 20l1.395-3.72C5.512 15.042 4 13.574 4 12c0-4.418 4.418-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Interactive Chat</h3>
              <p className="text-sm text-gray-600">
                Ask questions and get contextual answers
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Processing</h3>
              <p className="text-sm text-gray-600">
                Your documents are processed securely and privately
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
