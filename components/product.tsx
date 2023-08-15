import React, { useState , useRef , useEffect } from 'react';
import {Text, View, StyleSheet, Pressable, Platform } from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzXwiFzXFn5HeBeZZ1mwMbFUtziHApAkw",
  authDomain: "convident-language-app.firebaseapp.com",
  projectId: "convident-language-app",
  storageBucket: "convident-language-app.appspot.com",
  messagingSenderId: "321904847517",
  appId: "1:321904847517:web:dff548dc3a3b6e07824274",
  measurementId: "G-ME8V16G8Q0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default function MainProduct() {

    const [recording, setRecording] = useState<Audio.Recording | undefined>()
    const [isTranscribing, setTranscribing] = useState(false)
    const [isReplying, setReplying] = useState(false)
    const langCodes = ["en", "zh", "ko"]
    const [baseLang, setBase] = useState("en")
    const [targetLang, setTarget] = useState("en")
    const [messages, setMsgs] = useState<string[]>([])
    const [replies, setReplies] = useState<string[]>([])
    const langs = [
        {key:'0', value:"English"},
        {key:'1', value:"Chinese"},
        {key:'2', value:"Korean"},
    ]

    async function startRecording() {
        try {
          console.log('Requesting permissions..');
          await Audio.requestPermissionsAsync();
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
    
          console.log('Starting recording..');
          const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          setRecording(recording);
          console.log('Recording started');
        } catch (err) {
          console.error('Failed to start recording', err);
        }
      }
    
      async function stopRecording() {
        console.log('Stopping recording..');
        setRecording(undefined);
        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync(
          {
            allowsRecordingIOS: false,
          }
        );
        let time = Date.now()
        let uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);
        // Create a file name for the recording
        /*const fileName = `recording-${Date.now()}.wav`;
        const newUri = FileSystem.documentDirectory + 'recordings/' + `${fileName}`
        // Move the recording to the new directory with the new file name
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
        await FileSystem.moveAsync({
          from: uri,
          to: newUri
        });*/
        let file = await (await fetch(uri)).blob()
        let fname = `audio/recording-${time}.m4a`
        const audioRef = ref(storage, fname)
        await uploadBytes(audioRef, file).then(() => {
          console.log('Audio Uploaded')
        })

        let firstMsg = ""

        setTranscribing(true)
        await getDownloadURL(audioRef).then(async (url) => {
          
          let data = new FormData();
          data.append("fileUrl", url)
          await fetch('https://api-beige-one-57.vercel.app/sttmobile/' + baseLang + '/' + targetLang + '/', {
            method: 'POST',
            body: data,
            headers: {
              accept: 'application/json'
            }
          }).then(res => res.json())
            .then(async data => {
              console.log("bruh")
              firstMsg = data.transcription
              setMsgs([...messages, data.transcription])
              // This is for simply playing the sound back
              const playbackObject = new Audio.Sound();
              await playbackObject.loadAsync({ uri: uri});
              await playbackObject.playAsync();
        
          })
        })

        setTranscribing(false)

        setReplying(true)
        let message = new FormData();
        let response = ""
        message.append('message',firstMsg)
        await fetch('https://api-beige-one-57.vercel.app/reply/', {
        //await fetch('http://localhost:5000/reply/', {
            method: 'POST',
            body: message,
            headers: {
              accept: 'application/json'
            }
        }).then(res => res.json()).then(data => {

            response = data.reply
        })
        
        let toSpeak = new FormData()
        toSpeak.append('text',response)
        await fetch('https://api-beige-one-57.vercel.app/speak/' + targetLang + '/', {
        //await fetch('http://localhost:5000/speak/', {
            method: 'POST',
            body: toSpeak,
            headers: {
              accept: 'audio/wav'
            }
        }).then(res => res.blob()).then(async (data) => {
            let fname = `audio/reply-${time}.m4a`
            const audioRef = ref(storage, fname)
            await uploadBytes(audioRef, data).then(() => {
              console.log('Audio Uploaded')
            })
            await getDownloadURL(audioRef).then(async (url) => {
              setReplying(false)
              setReplies([...replies,response])
              const playbackObject = new Audio.Sound();
              await playbackObject.loadAsync({uri:url});
              await playbackObject.playAsync();
            })

        })
      }

    const convoTexts = messages.map((message,i) => {
        return <View className = "" key={i}>
                    <View>
                        <Text className="text-right mr-12">You</Text>
                        <View className="flex flex-row-reverse">
                            <View className="bg-soft-blue self-end mb-4 aspect-square min-w-8 w-8 h-auto rounded-full"></View>
                            <View className="mr-2 mb-2 rounded-lg bg-blue-600 min-w-[10%] max-w-[80%]">
                              <Text className="p-4 text-white">{message}</Text>
                            </View>
                            
                        </View>
                    </View>
                    <View>
                        <Text className="text-left ml-12">John</Text>
                        <View className = "flex flex-row">
                        
                            <View className="bg-soft-blue self-end mb-4 aspect-square min-w-8 w-8 h-auto rounded-full"></View>
                            <View className="ml-2 mb-4 rounded-lg bg-slate-200 min-w-[10%] max-w-[80%]">
                              {i >= replies.length && isReplying ? 
                                (<Text className="text-left p-4">Replying...</Text>) : 
                                (<Text className="text-left p-4">{replies[i]}</Text>)}
                            </View>
                            
                        </View>
                    </View>
                </View>
    })

    return (
        <View id="product">
            <Text className="text-5xl xl:text-7xl mt-2 text-center font-Ubuntu text-off-black">Test Our Product</Text>
            
            <View className="flex-row w-full">
                <View className="mr-[8%] ml-8 w-1/3">
                    <Text className="mt-3 font-Ubuntu text-center ">Base Language</Text>
                    <SelectList setSelected={(val) => setBase(langCodes[val])} data={langs} save="key" fontFamily='Ubuntu' search={ false } />
                </View>
                <View className="ml-[8%] mr-8 w-1/3">
                    <Text className="mt-3 font-Ubuntu text-center ">Target Language</Text>
                    <SelectList setSelected={(val) => setTarget(langCodes[val])} data={langs} save="key" fontFamily='Ubuntu' search={ false } />
                </View>
            
            </View>
            <View className="ml-4 mt-6 mr-4 lg:ml-32 lg:mr-32 border-2 p-3 min-h-[40%] rounded-lg">
                <View className="">{convoTexts}</View>
                {isTranscribing ? <Text className="text-right p-6">Transcribing...</Text>: null}
            </View>
            {!recording ? (<Pressable className="m-8 bg-red-600 p-4 w-32 rounded-2xl self-center" onPress={startRecording}><Text className="text-white text-center font-Ubuntu">Start recording</Text></Pressable>):null}
            {recording ? (<Pressable className="m-8 bg-gray-500 p-4 w-32 rounded-2xl self-center" onPress={stopRecording}><Text className="text-white text-center font-Ubuntu">Stop recording</Text></Pressable>):null}
        </View>
    );
};