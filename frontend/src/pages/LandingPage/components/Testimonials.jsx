const testimonials = [
  {
    name: "Rahul Patil",
    role: "Entrepreneur",
    quote: "Bridge helped me find the perfect investor for my AI startup. The process was smooth and transparent.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces",
  },
  {
    name: "Priya Sharma",
    role: "Freelancer",
    quote: "I joined 2 startups through Bridge and gained real-world experience. It's a game changer for freelancers.",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=faces",
  },
  {
    name: "Amit Kulkarni",
    role: "Investor",
    quote: "Bridge gives me access to high-quality founders and real-time progress tracking. Exactly what I was looking for.",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=faces",
  },
];

export default function Testimonials() {
  return (
    <section className="px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl rounded-3xl bg-[#111827] px-7 py-12 text-center shadow-2xl shadow-blue-950/30 ring-1 ring-white/5 md:px-16">
        <h2 className="text-3xl font-black tracking-normal text-white md:text-4xl">
          Loved by Our Community
        </h2>
        <p className="mt-3 text-base font-medium text-gray-400">
          Real voices from entrepreneurs, freelancers and investors
        </p>

        <div className="mt-10 grid gap-7 text-left md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="rounded-xl border border-white/5 bg-white/[0.03] p-7 shadow-lg">
              <div className="flex gap-4">
                <img
                  src={testimonial.photo}
                  alt={testimonial.name}
                  className="h-14 w-14 rounded-full border-4 border-white/10 object-cover"
                />
                <p className="text-sm font-medium italic leading-6 text-gray-300">
                  "{testimonial.quote}"
                </p>
              </div>
              <div className="mt-6 pl-[72px]">
                <div className="font-black text-white">{testimonial.name}</div>
                <div className="mt-1 text-sm font-medium text-gray-400">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3157ff]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
      </div>
    </section>
  );
}
