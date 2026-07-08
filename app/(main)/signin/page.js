import Link from "next/link";

const SignIn = () => {
  return (
    <form className=" mx-auto md:max-w-80 space-y-2 mt-14">
      <label className="form-control md:w-96 w-72 px-1 mx-auto">
        <div className="label">
          <span className="label-text">আপনার নাম্বার কী?</span>
        </div>
        <input
          name="number"
          type="text"
          placeholder="আপনার নাম্বার"
          className="input input-bordered w-full"
        />
        <div className="label flex justify-end">
          <Link href="/adminSignin" className="text-sm text-blue-600 underline">
            অ্যাডমিন?
          </Link>
        </div>
      </label>
      <div className="text-center">
        <button className="btn btn-outline btn-info" type="button">
          প্রবেশ করুন
        </button>
      </div>
    </form>
  );
};

export default SignIn;
