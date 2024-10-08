import logo from './logo.svg';
import './App.css';
import ReactPlayer from 'react-player';
import { useEffect, useState } from 'react';
import { CiTrash, CiVolumeHigh } from "react-icons/ci";
import { CiPlay1 } from "react-icons/ci";
import { CiPause1 } from "react-icons/ci";
import { Rnd } from 'react-rnd';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [inputurl, setInputUrl] = useState("")
  const [steamUrl, setStreamUrl] = useState("")
  const [playing, setPlayinh] = useState(false)
  const [volume, setVolume] = useState(false)
  const [fetchOverlays, setFetchOverlays] = useState(true)
  const [focussedParentId, setFocussedParentId] = useState()
  const [overLays, setOverlays] = useState([])


  const [modifiedOverlays, setModifiedOverlays] = useState([]); // Track modified overlays

  useEffect(() => {
    if (fetchOverlays) {
      fetch('http://localhost:5000/api/overlays', {
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


  useEffect(() => {
    console.log('The state is: ', overLays);
  }, [overLays]); // This effect runs whenever overLays changes
  // Add a new text overlay
  const addTextOverlay = () => {
    setOverlays(prev => [
      ...prev,
      {
        id: uuidv4(),
        type: "TEXT",
        name: "text_overlay",
        content: "",
        parameters: {
          width: 100,
          height: 30,
          x: 10,
          y: 10,
        },
      },
    ]);
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
            id: uuidv4(),
            type: "IMAGE",
            name: "image_overlay",
            imageSrc: imageUrl, // Image URL after upload
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

  // Handle save (dummy API call)
  const saveChanges = () => {
    console.log("Modified overlays sent to backend:", modifiedOverlays);
    // Dummy POST API call
    fetch("http://localhost:5000/api/overlays", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(overLays) // Send only the modified overlays
    })
      .then(response => response.json())
      .then(data => {
        console.log("Save response:", data);
        // Clear modifiedOverlays after save
        setModifiedOverlays([]);
      })
      .finally(() => setFetchOverlays(true))
      .catch(error => {
        console.error("Error saving overlays:", error);
      });
  };

  const streamVideo = () => {
    setStreamUrl(inputurl)
    setPlayinh(true)
  }

  const getFontSize = (overlay) => {
    const baseFontSize = 14;  // Default font size when the box is at reference width
    const referenceWidth = 100;  // Default/initial width of the box
    const scaleFactor = overlay.parameters.width / referenceWidth;  // Scale factor based on current width

    // Ensure the font doesn't scale down too much by setting a minimum font size
    return Math.max(baseFontSize * scaleFactor, 10);  // 10px minimum font size
  }

  const handleUrlInput = (e) => {
    setStreamUrl(e.target.value)
  }

  const handleDelete = (overlay_id) => {
    fetch(`http://localhost:5000/api/overlays/${overlay_id}`, {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(() => setOverlays(overLays.filter(o => o.id != overlay_id)))
      .then(() => setFetchOverlays(false))
      .catch((error) => console.log('Error: ', error))
  }
  return (
    <div className="min-h-screen items-center bg-gray-900 w-full flex justify-evenly">
      <header className=" max-w-[500px] w-full">
        <section class="bg-white dark:bg-gray-900">
          <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
            <div class="max-w-screen-md">
              <h2 class="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">Let's find more that brings us together.</h2>
              <p class="mb-8 font-light text-gray-500 sm:text-xl dark:text-gray-400">Flowbite helps you connect with friends, family and communities of people who share your interests. Connecting with your friends and family as well as discovering new ones is easy with features like Groups, Watch and Marketplace.</p>
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
      <div className='flex flex-col gap-2'>
        <div className='h-[500px] w-full bg-gray-500 min-w-[200px] border-2 border-blue-500'>
          <ReactPlayer
            url={steamUrl}
            playing={playing}    // Play/pause control
            volume={volume}      // Volume control
            width="100%"         // Video width
            height="500px"
          />
          {overLays.map((overlay) => (
            <Rnd
              key={overlay.id}
              bounds="parent"
              size={{ width: overlay.parameters.width, height: overlay.parameters.height }}
              position={{ x: overlay.parameters.x, y: overlay.parameters.y }}
              onDragStop={(e, d) => setOverlays(prev => prev.map(o => o.id === overlay.id ? { ...o, parameters: { ...o.parameters, x: d.x, y: d.y } } : o))}
              onResizeStop={(e, direction, ref, delta, position) =>
                setOverlays(prev => prev.map(o => o.id === overlay.id ? { ...o, parameters: { ...o.parameters, width: ref.style.width.replace('px', ''), height: ref.style.height.replace('px', '') } } : o))}
            >
              {overlay.type === "TEXT" ? (
                <div
                  tabIndex={0}
                  onFocus={() => setFocussedParentId(overlay.id)}
                  onBlur={() => setFocussedParentId(null)}
                  style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p
                    className="text-white border border-white"
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
                      value={overLays.find((x) => x.id === overlay.id).content}
                      onChange={(e) =>
                        setOverlays((prev) =>
                          prev.map((o) => (o.id === overlay.id ? { ...o, content: e.target.value } : o))
                        )
                      }
                      className="absolute inset-0 w-full h-full bg-transparent text-transparent focus:outline-none focus:ring-0"
                    />
                    {overlay.content}
                  </p>
                  {
                    focussedParentId === overlay.id && <CiTrash onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(overlay.id)
                    }} className='text-2xl absolute -top-5 -right-5' />
                  }
                </div>
              ) : (
                <div
                  tabIndex={0}
                  onFocus={() => setFocussedParentId(overlay.id)}
                  onBlur={() => setFocussedParentId(null)}
                >
                  <img

                    src={overlay.imageSrc}
                    alt="Overlay"
                    onDragStart={e => e.preventDefault()}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} // Scale image
                  />
                  {
                    focussedParentId === overlay.id && <CiTrash onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(overlay.id)
                    }} className='text-2xl absolute -top-5 -right-5' />
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
    </div >
  );
}

export default App;
