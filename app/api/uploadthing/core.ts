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
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter