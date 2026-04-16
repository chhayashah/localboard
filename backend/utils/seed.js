require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const Job = require("../models/Job");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/localboard";

const sampleUsers = [
  {
    name: "Ravi Kumar Sharma",
    phone: "9876543210",
    bio: "Ward 12 ka apna aadmi 🙏 Har samasya ki awaaz",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    role: "user",
    isVerified: false,
  },
  {
    name: "Priya Verma",
    phone: "9876543211",
    bio: "Journalist | Bhopal News Network | Truth ko saamne laana mera kaam",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    role: "reporter",
    isVerified: true,
  },
  {
    name: "MLA Suresh Tiwari",
    phone: "9876543212",
    bio: "MLA, Ward 12 | Aapki seva mera dharm | BJP",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    role: "mla",
    isVerified: true,
  },
  {
    name: "Parshad Meena Devi",
    phone: "9876543213",
    bio: "Parshad Ward 12 | Mahilaon ki awaaz | Congress",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    role: "parshad",
    isVerified: true,
  },
  {
    name: "Rahul Opposition",
    phone: "9876543214",
    bio: "Opposition Voice | Sawaal poochhna hamara haq hai",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    role: "opposition",
    isVerified: false,
  },
  {
    name: "Anita Singh",
    phone: "9876543215",
    bio: "Ghar ki rasoi se startup tak | Homechef & Entrepreneur",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    role: "user",
    isVerified: false,
  },
  {
    name: "Deepak Patel",
    phone: "9876543216",
    bio: "Local business owner | Kirana store | Ward 12",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    role: "user",
    isVerified: false,
  },
  {
    name: "Sunita Reporters",
    phone: "9876543217",
    bio: "Community reporter | Aapke area ki khabar sबसे पहले",
    location: { city: "Bhopal", ward: "Ward 15", pincode: "462002" },
    role: "reporter",
    isVerified: true,
  },
];

const samplePosts = (users) => [
  {
    user: users[2]._id, // MLA
    content:
      "🏗️ Khushi ki baat hai! Ward 12 mein nayi sadak ka nirman kal se shuru hoga. Rs 45 lakh ki yojana se 2.3 km road ban rahi hai. Sabka shukriya! #Ward12 #Vikas #BhopalSmartCity",
    type: "update",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    likes: [users[0]._id, users[3]._id, users[5]._id],
    isVerifiedPost: true,
  },
  {
    user: users[1]._id, // Reporter
    content:
      "⚡ BREAKING: Ward 12 ke Main Market mein bijli ki problem 3 din se hai. 200 se zyada ghar prabhavit. Bijli vibhag ne kaha kal tak theek ho jayega. Aap bhi affected hain? Comment mein batayein. #Ward12 #BhopalNews #BijliSamasya",
    type: "news",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    likes: [users[0]._id, users[4]._id, users[6]._id, users[2]._id],
    isVerifiedPost: true,
  },
  {
    user: users[0]._id, // Regular user
    content:
      "🚮 Ward 12, Sector B ke paas kachre ka dhera 1 hafte se saaf nahi hua. Bachon ko school jaane mein takleef ho rahi hai. MLA sahab, Parshad ji kuch karein please! @MLASureshTiwari #Ward12 #SafaiSamasya #AawazUthao",
    type: "post",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    likes: [users[3]._id, users[5]._id, users[6]._id],
  },
  {
    user: users[4]._id, // Opposition
    content:
      "❓ MLA sahab ne sadak ke liye 45 lakh ka dawa kiya. Lekin 2 saal pehle bhi aise hi ghoshna hui thi - kuch nahi hua. Is baar proof chahiye. Kab shuru hogi sadak? #Ward12 #JawabDo #Opposition",
    type: "post",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    likes: [users[0]._id, users[5]._id],
  },
  {
    user: users[5]._id, // Anita
    content:
      "🍱 Aaj se meri homemade tiffin service shuru! Pure ghar ka khana, safai ka poora dhyan. Ward 12 mein free delivery. Rs 80/tiffin. Order ke liye message karein 😊 #Ward12 #HomeMade #TiffinService #LocalBusiness",
    type: "post",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    likes: [users[0]._id, users[6]._id, users[2]._id, users[3]._id],
  },
  {
    user: users[3]._id, // Parshad
    content:
      "🌳 Kal Ward 12 Community Park mein vrikshaaropan karyakram. Sabhi vaasiyon ko nimantran hai. Saath milke apna ward hariyaali se bharein! Subah 8 baje. #Ward12 #GreenBhopal #Community",
    type: "update",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    likes: [users[0]._id, users[5]._id, users[1]._id],
    isVerifiedPost: true,
  },
  {
    user: users[6]._id, // Deepak
    content:
      '🛒 Meri dukan "Deepak Kirana Store" mein ab UPI payment shuru! Google Pay, PhonePe, Paytm sab chalega. Ward 12 main bazaar ke paas. #Ward12 #DigitalPayment #LocalBusiness #KiranaStore',
    type: "post",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    likes: [users[0]._id, users[3]._id],
  },
  {
    user: users[1]._id, // Reporter
    content:
      "📊 Ward 12 water supply update: Municipal corporation ne bataya ki naye pipeline ka kaam 15 din mein poora ho jaayega. Tab se roz subah pani milega. #Ward12 #PaaniSamasya #BhopalMunicipal",
    type: "news",
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
    likes: [
      users[0]._id,
      users[2]._id,
      users[4]._id,
      users[5]._id,
      users[6]._id,
    ],
    isVerifiedPost: true,
  },
];

const sampleJobs = (users) => [
  {
    postedBy: users[6]._id,
    title: "Delivery Boy Chahiye - Kirana Store",
    description:
      "Deepak Kirana Store ke liye ek trustworthy delivery boy chahiye. Ward 12 area mein delivery karni hogi. Cycle ya bike hona zaroori. Timing: Subah 9 baje se sham 7 baje tak.",
    category: "delivery",
    contactPhone: "9876543216",
    whatsapp: "9876543216",
    salary: { amount: 8000, period: "monthly", negotiable: true },
    location: {
      city: "Bhopal",
      ward: "Ward 12",
      pincode: "462001",
      address: "Main Bazaar, Ward 12",
    },
  },
  {
    postedBy: users[5]._id,
    title: "Kitchen Helper - Tiffin Service",
    description:
      "Ghar ki tiffin service ke liye ek helper chahiye. Kaam: sabzi kaat na, bartan dhona, packing karna. Timing subah 7 baje se 11 baje tak. Mahilaaon ko preference.",
    category: "cook",
    contactPhone: "9876543215",
    whatsapp: "9876543215",
    salary: { amount: 4000, period: "monthly", negotiable: true },
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
  },
  {
    postedBy: users[2]._id,
    title: "Office Peon / Chowkidar",
    description:
      "MLA office ke liye ek peon chahiye. Kaam: office saaf karna, chai banana, documents deliver karna. Salary + lunch included. Honest aur punctual candidate apply karein.",
    category: "security",
    contactPhone: "9876543212",
    salary: { amount: 7000, period: "monthly", negotiable: false },
    location: {
      city: "Bhopal",
      ward: "Ward 12",
      pincode: "462001",
      address: "MLA Office, Ward 12",
    },
  },
  {
    postedBy: users[0]._id,
    title: "Computer Teacher - Home Tuition",
    description:
      "Mujhe apne 2 bachon ke liye computer teacher chahiye. MS Office, basic internet sikhana hai. Timing flexible. Week mein 3 din. Nearby ward se hi contact karein.",
    category: "teaching",
    contactPhone: "9876543210",
    whatsapp: "9876543210",
    salary: { amount: 3000, period: "monthly", negotiable: true },
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
  },
  {
    postedBy: users[3]._id,
    title: "Safai Karamchari - Community Work",
    description:
      "Ward 12 ke community park aur aas paas ki sadkon ki safai ke liye 2 karamchari chahiye. Government scheme ke tahat. Documents zaroori. Aadhar card leke aayein.",
    category: "cleaner",
    contactPhone: "9876543213",
    salary: { amount: 6000, period: "monthly", negotiable: false },
    location: { city: "Bhopal", ward: "Ward 12", pincode: "462001" },
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Job.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Create users
    const users = await User.insertMany(sampleUsers);
    console.log(`👥 Created ${users.length} users`);

    // Set follower relationships
    await User.findByIdAndUpdate(users[0]._id, {
      following: [users[1]._id, users[2]._id, users[3]._id],
      followers: [users[5]._id, users[6]._id],
    });
    await User.findByIdAndUpdate(users[2]._id, {
      followers: [
        users[0]._id,
        users[1]._id,
        users[3]._id,
        users[5]._id,
        users[6]._id,
      ],
    });

    // Create posts
    const posts = await Post.insertMany(samplePosts(users));
    console.log(`📝 Created ${posts.length} posts`);

    // Update post counts
    for (const user of users) {
      const count = posts.filter(
        (p) => p.user.toString() === user._id.toString(),
      ).length;
      await User.findByIdAndUpdate(user._id, { postCount: count });
    }

    // Create jobs
    const jobs = await Job.insertMany(sampleJobs(users));
    console.log(`💼 Created ${jobs.length} job listings`);

    console.log("\n🎉 Seed data created successfully!");
    console.log("\n📋 Test Accounts (phone → OTP: 123456):");
    users.forEach((u) =>
      console.log(
        `   ${u.role.toUpperCase().padEnd(12)} → ${u.phone} (${u.name})`,
      ),
    );

    console.log("\n🏙️  LocalBoard is ready! Apna Sheher. Apni Awaaz.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seedDB();
