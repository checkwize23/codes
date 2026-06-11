export const uploadToCloudinary = async (file) => {
  const formData = new FormData()

  formData.append("file", file)
  formData.append("upload_preset", "checkwize_uploads")

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/drvodxyko/auto/upload",
    {
      method: "POST",
      body: formData,
    }
  )

  const data = await response.json()

  return data.secure_url
}