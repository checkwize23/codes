import { useEffect, useState } from "react"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"

import manImg from '/man.png'
import secureImg from "/secure.png"
import verifiedImg from "/verified.png"
import complaintImg from "/complaint.png"

const ImageCarousel = () => {
    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => {
      setIsMounted(true)
    }, [])
    const textSlides = [secureImg, verifiedImg, complaintImg];
  
    const settings = {
      dots: false,
      infinite: true,
      autoplay: true,
      speed: 600,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplaySpeed: 3000,
      arrows: false,
      adaptiveHeight: false,
      lazyLoad: "ondemand",
      fade: true,
    }
  
    if (!isMounted) return null

    return (
      <div className="hero-carousel h-full">
      
       {/* static man image */}

        <div className='w-full flex justify-center items-center'>
          <img src={manImg} alt='man' className='w-full max-h-[80%] object-contain drop-shadow-xl'/>
        </div>

        {/* changing text slider */}
        <div className='w-full flex justify-center mt-5'>
          <div className='w-full'>  {/* controls alignment width */}
            <Slider {...settings}>
              {textSlides.map((src, i)=> (
                <div key={i} className='flex justify-center items-center w-full'>

                  <img src={src} alt={'text-${i}'} className='h-20 object-contain mx-auto'/>
                
                </div>
              ))} 
            </Slider>   
          </div>
      </div>  
      </div>
    );
  };
  
  export default ImageCarousel;
