"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { LlamaParseResult } from "@/types/api";
import { DocumentViewer } from "@/components/upload/DocumentViewer";
import { FileList } from "@/components/upload/FileList";
import { UploadSection } from "@/components/upload/UploadSection";
import { ProcessingStatus } from "@/components/ProcessingModal";

interface UploadComponentProps {
  projectId: string | null;
}

export function UploadComponent({ projectId }: UploadComponentProps) {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<LlamaParseResult[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LlamaParseResult | null>(null);
  const [viewingDocument, setViewingDocument] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("uploading");

  // Handle file upload completion
  const handleFileProcessed = async (result: LlamaParseResult) => {

    // Add project ID to the result object for reference
    const resultWithProject: LlamaParseResult = {
      ...result,
      projectId: projectId || undefined
    };

    try {
      // Update status to parsing when starting OpenAI processing
      setProcessingStatus("parsing");
      
      // Store the questions in the database
      const extractResponse = await fetch('/api/extract-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: result.documentId,
          documentName: result.documentName,
          content: result.content,
          projectId, // Add the project ID to link questions to this project
        }),
      });

      if (!extractResponse.ok) {
        const errorBody = await extractResponse.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to extract questions');
      }

      // Update status to extracting when OpenAI is processing
      setProcessingStatus("extracting");
      
      // Get the response data
      const extractedData = await extractResponse.json();
      
      // Mark as complete
      setProcessingStatus("complete");

      // Add to uploaded files
      setUploadedFiles(prev => [...prev, resultWithProject]);
      
      // Wait a moment to show completion state before redirecting
      setTimeout(() => {
        // Redirect to questions page
        router.push(`/projects/${projectId}/questions`);
      }, 1000);
    } catch (error) {
      console.error('Error processing document:', error);
      setProcessingStatus('uploading');
      toast({
        title: 'Processing failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to process document',
        variant: 'destructive',
      });
    }
  };

  // Update processing status from child components
  const updateProcessingStatus = (status: ProcessingStatus) => {
    setProcessingStatus(status);
  };

  // Handle document selection for viewing
  const handleViewDocument = (doc: LlamaParseResult) => {
    setSelectedDocument(doc);
    setViewingDocument(true);
  };

  // Handle back button click to return to file list
  const handleBackToList = () => {
    setViewingDocument(false);
  };

  return (
    <>
      {viewingDocument && selectedDocument ? (
        <DocumentViewer 
          document={selectedDocument} 
          onBack={handleBackToList}
          updateProcessingStatus={updateProcessingStatus}
        />
      ) : (
        <>
          <UploadSection 
            onFileProcessed={handleFileProcessed}
            processingStatus={processingStatus}
            updateProcessingStatus={updateProcessingStatus}
          />
          <FileList files={uploadedFiles} onViewDocument={handleViewDocument} />
        </>
      )}
      
      <Toaster />
    </>
  );
} 