const Footer = () => {
  return (
    <footer className="py-10 text-white bg-gray-900">
      <div className="container flex flex-col items-center mx-auto">
        {/* Developed By Section */}
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold text-gray-300">Developed by</p>
        </div>

        <div className="flex flex-col items-center justify-center space-y-8 md:flex-row md:space-x-10 md:space-y-0">
          {/* First Profile Card */}
          <div className="flex items-center p-6 bg-gray-800 rounded-lg shadow-md">
            <img
              src="https://avatars.githubusercontent.com/u/108600250?v=4"
              alt="Profile 1"
              className="w-24 h-24 mb-4 rounded-full"
            />
            <div className="flex flex-col space-x-5">
              <h3 className="mb-2 ml-5 text-lg font-semibold">
                Muhammed Mehedi Hasan
              </h3>
              <div className="flex mb-2 space-x-4">
                <a href="" className="text-blue-500 hover:text-blue-400">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="" className="text-blue-400 hover:text-blue-300">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="" className="text-pink-500 hover:text-pink-400">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
              <p className="text-sm">muhammedmehedih@gmail.com</p>
            </div>
          </div>

          {/* Vertical Line */}
          <div className="hidden w-px h-32 bg-gray-700 md:block"></div>

          {/* Second Profile Card */}
          <div className="flex items-center p-6 bg-gray-800 rounded-lg shadow-md">
            <img
              src="https://avatars.githubusercontent.com/u/145375204?v=4"
              alt="Profile 2"
              className="w-24 h-24 mb-4 rounded-full"
            />
            <div className="flex flex-col space-x-5">
              <h3 className="mb-2 ml-5 text-lg font-semibold">
                Azizul Islam Adnan
              </h3>
              <div className="flex mb-2 space-x-4">
                <a
                  href="https://www.facebook.com/AdnaNation.Me"
                  className="text-blue-500 hover:text-blue-400"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a
                  href="https://x.com/AzizuIslamAdnan"
                  className="text-blue-400 hover:text-blue-300"
                >
                  <i className="fab fa-twitter"></i>
                </a>
                <a
                  href="https://www.instagram.com/azizul_islam_adnan"
                  className="text-pink-500 hover:text-pink-400"
                >
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
              <p className="text-sm">azizulislamadnan@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Islampur Jame Masjid. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
