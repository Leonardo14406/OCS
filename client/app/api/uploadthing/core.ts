import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getCurrentAccount } from "@/lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference in @uploadthing/react.
       * @see https://docs.uploadthing.com/get-started/appdir#file-route-configuration
       */
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 2,
    },
    "application/msword": {
      maxFileSize: "16MB",
      maxFileCount: 2,
    },
    "video/mp4": {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await getCurrentAccount()

      // If you throw, the user will not be able to upload
      if (!user) {
        // Allow guest uploads with null user ID
        return { userId: null }
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId)

      console.log("file url", file.url)

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        uploadedBy: metadata.userId,
        url: file.url,
        name: file.name,
        size: file.size,
        type: file.type,
      }
    }),

  // Evidence uploader for complaints
  evidenceUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 5 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { 
      maxFileSize: "16MB", 
      maxFileCount: 5 
    },
    "text/plain": { maxFileSize: "2MB", maxFileCount: 5 },
    "video/mp4": { maxFileSize: "32MB", maxFileCount: 2 },
    "audio/mpeg": { maxFileSize: "32MB", maxFileCount: 3 },
  })
    .middleware(async ({ req }) => {
      // Extract complaint tracking number from query params or headers
      const url = new URL(req.url || '');
      const trackingNumber = url.searchParams.get('trackingNumber') as string || 
                           req.headers.get('x-tracking-number');

      if (!trackingNumber) {
        throw new Error("Tracking number is required for evidence upload");
      }

      // Validate tracking number format (OMB-XXXXXXXX-XXXXXXXX)
      if (!/^OMB-[A-Z0-9]+-[A-Z0-9]+$/i.test(trackingNumber)) {
        throw new Error("Invalid tracking number format");
      }

      // Get user info if available
      const user = await getCurrentAccount();

      return { 
        userId: user?.id || null,
        trackingNumber,
        uploadType: 'evidence'
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Evidence upload complete for tracking number:", metadata.trackingNumber);
      console.log("file url", file.url);

      // Store evidence metadata in database
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/evidence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trackingNumber: metadata.trackingNumber,
            evidence: {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              url: file.url,
              uploadedBy: metadata.userId,
              uploadedAt: new Date().toISOString()
            }
          })
        });

        if (!response.ok) {
          console.error("Failed to store evidence metadata");
          throw new Error("Failed to store evidence metadata");
        }

        const result = await response.json();
        console.log("Evidence metadata stored:", result);

        return {
          success: true,
          trackingNumber: metadata.trackingNumber,
          url: file.url,
          name: file.name,
          size: file.size,
          type: file.type,
          evidenceId: result.evidenceId,
          uploadedBy: metadata.userId
        };
      } catch (error) {
        console.error("Error storing evidence metadata:", error);
        // Still return file info even if database storage fails
        return {
          success: false,
          trackingNumber: metadata.trackingNumber,
          url: file.url,
          name: file.name,
          size: file.size,
          type: file.type,
          error: "Failed to store metadata in database"
        };
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter