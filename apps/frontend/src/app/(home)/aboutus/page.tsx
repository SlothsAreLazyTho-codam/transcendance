export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="flex items-center justify-center w-full relative">
      <div className="bg-neutral-900 text-neutral-300 p-4 rounded-md mt-4 neon-border">
        <p className="font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl p-4">
          About Page
        </p>

        <div className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]" />

        <p className="px-4 text-base sm:text-lg md:text-xl lg:text-2xl text-right leading-relaxed">
          This page has been made by a bunch of nerds doing nerd stuff for their
          school and such. If you like this page, press the mental like button
          right inside your noggin's and pretend you did a good job at liking
          something without using any social media platform! Alright, good job!
          <br></br>
          <br></br>
          <a
            className="py-1 px-2 font-doto text-neutral-300 transition-colors duration-300 bg-transparent hover:bg-lime-300 hover:text-black rounded-md"
            href="https://www.github.com/kennyohhst"
            target="_blank"
          >
            Kenny's Github
          </a>
          <br></br>
          <br></br>
          <a
            className="py-1 px-2 font-doto text-neutral-300 transition-colors duration-300 bg-transparent hover:bg-fuchsia-300 hover:text-black rounded-md"
            href="https://nikander100.nl"
            target="_blank"
          >
            Nikander's Github
          </a>
          <br></br>
          <br></br>
          <a
            className="py-1 px-2 font-doto text-neutral-300 transition-colors duration-300 bg-transparent hover:bg-cyan-300 hover:text-black rounded-md"
            href="https://www.github.com/SlothsAreLazyTho"
            target="_blank"
          >
            Chino's Github
          </a>
        </p>
      
      <div className="w-full h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-lime-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]" />
        
    </div>

    </div>
  );
}
