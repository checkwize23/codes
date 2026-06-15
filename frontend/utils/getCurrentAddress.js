export const getCurrentAddress = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Location not supported")
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await response.json()
          resolve({
            address: data.display_name,
            latitude,
            longitude
          })
        } catch {reject("Failed to fetch address")}
      },
      () => reject("Location permission denied"),
      {
        enableHighAccuracy: true
      }
    )
  })
}