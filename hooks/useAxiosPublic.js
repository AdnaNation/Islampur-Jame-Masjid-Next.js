import axios from "axios";

const axiosPublic = axios.create({
  baseURL: "/api",
});

const useAxiosPublic = () => {
  return axiosPublic;
};

export default useAxiosPublic;
