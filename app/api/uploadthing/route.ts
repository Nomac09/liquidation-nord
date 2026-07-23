import { createRouteHandler } from "uploadthing/next"
import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

// Define file router for product images
export const ourFileRouter = {
  productImageUploader: f({ 
    image: { 
      maxFileSize: "4MB", 
      maxFileCount: 10 
    } 
  })
    .onUploadComplete(async ({ file }) => {
      console.log("✅ Upload complete:", file.url)
      return { url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

// Export route handlers
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})