import './App.css';
import ReactPlayer from 'react-player';
import { useEffect, useState } from 'react';
import { CiVolumeHigh } from "react-icons/ci";
import { CiPlay1 } from "react-icons/ci";
import { CiPause1 } from "react-icons/ci";
import { Rnd } from 'react-rnd';
import { v4 as uuidv4 } from 'uuid';
import { TbTrashXFilled } from "react-icons/tb";

function App() {
  const [inputurl, setInputUrl] = useState("")
  const [steamUrl, setStreamUrl] = useState("")
  const [playing, setPlayinh] = useState(false)
  const [volume, setVolume] = useState(false)
  const [fetchOverlays, setFetchOverlays] = useState(true)
  const [focussedParentId, setFocussedParentId] = useState()
  const [overLays, setOverlays] = useState([])

  useEffect(() => {
    if (fetchOverlays) {
      fetch(`${process.env.PUBLIC_API_URL}/api/overlays`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        },
      })
        .then(response => response.json())
        .then(data => {
          console.log('Data calling: ', data)
          setOverlays(data)
        })
        .finally(() => {
          setFetchOverlays(false)
          console.log('The state is: ', overLays)
        })
    }
  }, [fetchOverlays])

  const addTextOverlay = () => {
    const newTextOverlay = {
      uuid: uuidv4(),
      type: "TEXT",
      name: "text_overlay",
      content: "",
      parameters: {
        width: 100,
        height: 30,
        x: 10,
        y: 10,
      },
    }

    setOverlays(prev => [
      ...prev,
      newTextOverlay
    ])
  };



  // Add a new image overlay
  const addImageOverlay = (imageFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let width = 100;
        let height = 100;

        // Scale down while preserving aspect ratio
        if (aspectRatio > 1) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }

        setOverlays(prev => [
          ...prev,
          {
            uuid: uuidv4(),
            type: "IMAGE",
            name: "image_overlay",
            imageSrc: imageUrl, // For preview in frontend
            imageFile: imageFile, // Store the actual file to send to the backend
            parameters: {
              width,
              height,
              x: 10,
              y: 10,
            },
          },
        ]);
      };
    };
    reader.readAsDataURL(imageFile);
  };

  const saveChanges = () => {
    const formData = new FormData();
    overLays.forEach((overlay) => {
      formData.append('overlays', JSON.stringify(overlay)); // Attach overlay details
      if (overlay.imageFile) {
        formData.append('imageFiles', overlay.imageFile);  // Attach image file
      }
    });


    // Dummy POST API call
    fetch(`${process.env.PUBLIC_API_URL}/api/overlays`, {
      method: "POST",
      body: formData // Send only the modified overlays
    })
      .then(response => response.json())
      .then(data => {
        console.log("Save response:", data);
      })
      .finally(() => setFetchOverlays(true))
      .catch(error => {
        console.error("Error saving overlays:", error);
      });
  };

  const streamVideo = () => {
    fetch(`${process.env.PUBLIC_API_URL}/api/start-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "rtsp_url": inputurl
      })
    })
      .then(response => response.json())
      .then(data => {
        setStreamUrl(`${process.env.PUBLIC_API_URL}${data.hls_url}`)
        setPlayinh(true)
      })
      .catch(error => {
        alert('Cant play the stream. Check console logs')
        console.log(error)
      })
  }

  const handleUrlInput = (e) => {
    setInputUrl(e.target.value)
  }

  const handleDelete = (overlay_id) => {
    fetch(`${process.env.PUBLIC_API_URL}/api/overlays/${overlay_id}`, {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(() => setOverlays(overLays.filter(o => o.uuid != overlay_id)))
      .then(() => setFetchOverlays(false))
      .catch((error) => console.log('Error: ', error))
  }
  return (
    <>

      <div className="min-h-screen items-center bg-gray-900 w-full flex justify-evenly">
        <div
          className='fixed text-blue-500 top-0 left-0 w-full z-50 py-5 text-center font-extrabold'
        >
          <h1 className='text-5xl mb-2'> LiveSitter Assignment </h1>
          <h3 className='text-lg'> COnvert RTSP stream to HLS stream, enable functionality to add text and image overlays, save data to mongoDB. </h3>
        </div>
        <header className=" max-w-[500px] w-full">
          <section class="bg-white dark:bg-gray-900">
            <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
              <div class="max-w-screen-md">
                <h2 class="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Let's watch some live stream!</h2>
                <p class="mb-8 font-light text-gray-500 sm:text-xl dark:text-gray-400">This tool helps you connect live stream stuff of your interests. Try adding text overlays, image overlays, resizing, dragging, and saving. Saves your overlay data to mongoDB and load the existing overlay data on load</p>
                <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <input value={inputurl} placeholder='Enter the RTSP URL' onChange={handleUrlInput} className="inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-white bg-transparent border-white border rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-300" />

                  <button onClick={streamVideo} class="inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-blue-300 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                    Stream Now!
                  </button>
                </div>
              </div>
            </div>
          </section>
        </header>
        {
          steamUrl &&
          <div className='flex flex-col gap-2'>
            <div className='h-[500px] w-full bg-gray-500 min-w-[200px]'>

              <ReactPlayer
                url={steamUrl}
                playing={playing}    // Play/pause control
                volume={volume}      // Volume control
                width="100%"         // Video width
                height="500px"
              />

              {overLays.length > 0 && overLays.map((overlay) => (
                <Rnd
                  key={overlay.uuid}
                  bounds="parent"
                  size={{ width: overlay.parameters.width, height: overlay.parameters.height }}
                  position={{ x: overlay.parameters.x, y: overlay.parameters.y }}
                  onDragStop={(e, d) =>
                    setOverlays(prev =>
                      prev.map(o => o.uuid === overlay.uuid
                        ? { ...o, parameters: { ...o.parameters, x: d.x, y: d.y } }
                        : o
                      )
                    )
                  }
                  onResizeStop={(e, direction, ref, delta, position) => {
                    // Dynamically adjust the width/height based on the rendered text size
                    const newWidth = ref.offsetWidth;
                    const newHeight = ref.offsetHeight;

                    setOverlays(prev =>
                      prev.map(o => o.uuid === overlay.uuid
                        ? {
                          ...o,
                          parameters: {
                            ...o.parameters,
                            width: newWidth,
                            height: newHeight
                          }
                        }
                        : o
                      )
                    );
                  }}
                >
                  {overlay.type === "TEXT" ? (
                    <div
                      tabIndex={0}
                      onFocus={() => setFocussedParentId(overlay.uuid)}
                      onBlur={() => setFocussedParentId(null)}
                      style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p
                        className="text-white  border-2 border-white  font-bold "
                        tabIndex={0}
                        id={overlay.uuid}
                        style={{
                          fontSize: `${(overlay.parameters.width / 100) * 14}px`,
                          width: "100%",
                          height: "100%",
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                        }}
                      >
                        <input
                          value={overlay.content || ""}
                          onChange={(e) =>
                            setOverlays((prev) =>
                              prev.map((o) => (o.uuid === overlay.uuid ? { ...o, content: e.target.value } : o))
                            )
                          }
                          className="absolute inset-0 w-full h-full bg-transparent text-transparent focus:outline-none focus:ring-0"
                        />
                        {overlay.content}
                      </p>
                      {
                        focussedParentId === overlay.uuid && <TbTrashXFilled onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(overlay.uuid)
                        }} className='text-2xl absolute text-red-500 -top-5 -right-5' />
                      }
                    </div>
                  ) : (
                    <div
                      tabIndex={0}
                      onFocus={() => setFocussedParentId(overlay.uuid)}
                      onBlur={() => setFocussedParentId(null)}
                    >
                      <img

                        src={overlay.imageSrc}
                        alt="Overlay"
                        onDragStart={e => e.preventDefault()}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }} // Scale image
                      />
                      {
                        focussedParentId === overlay.uuid && <TbTrashXFilled onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(overlay.uuid)
                        }} className='text-2xl absolute -top-5 text-red-500 -right-5' />
                      }
                    </div>
                  )}

                </Rnd>
              ))}

              {/* Hidden file input for image upload */}
              <input
                type="file"
                id="image-upload"
                style={{ display: "none" }}
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    addImageOverlay(e.target.files[0]);
                  }
                }}
              />
            </div>

            <div className='flex items-center w-full text-white gap-4'>
              <button className='rounded-md text-white w-auto p-2' onClick={() => setPlayinh(!playing)}>
                {playing ? <CiPause1 /> : <CiPlay1 />}
              </button>

              {/* Volume Control */}
              <div className='flex gap-1'>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                />
                <label> <CiVolumeHigh /></label>
              </div>
              <div className='border justify-self-end flex items-center border-orange-400 border-collapse'>
                <div className='border-r border-orange-400 p-2 text-orange-400'>Overlays</div>

                <div className='p-2 flex items-center *:underline *:cursor-pointer gap-2'>
                  <button className='' onClick={addTextOverlay}>
                    Add text
                  </button>
                  <button
                    onClick={() => document.getElementById("image-upload").click()}

                  >
                    Add Logo
                  </button>
                  <button className="m-2 p-2 bg-green-500 text-white" onClick={saveChanges}>
                    Save
                  </button>

                </div>

              </div>
            </div>

          </div>
        }
      </div >
    </>
  );
}

export default App;          
