import { useCallback, useEffect, useMemo, useState } from "react"

const mediaConstraints: MediaStreamConstraints = {
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
}

export const useCameraStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    setStream((prevStream) => {
      prevStream?.getTracks().forEach((track) => track.stop())
      return null
    })
    setIsActive(false)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
      setStream(mediaStream)
      setIsActive(true)
    } catch {
      setError("Camera access blocked. Enable permissions to run live screening.")
    }
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const cameraState = useMemo(
    () => ({ isActive, hasStream: Boolean(stream), error }),
    [error, isActive, stream],
  )

  return { stream, startCamera, stopCamera, ...cameraState }
}

