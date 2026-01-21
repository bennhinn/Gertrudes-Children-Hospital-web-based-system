const { createClient } = require('@supabase/supabase-js')

// Replace with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lmmpdyxxouztgkobypaa.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbXBkeXh4b3V6dGdrb2J5cGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE3MTc1NCwiZXhwIjoyMDgzNzQ3NzU0fQ.8uVLgw9EMoOvmxM4wUq-Q-blZg3M7Re78oxhs8f3qKg'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Dummy users data - 2 users per role
const dummyUsers = [
  // ADMINS
  {
    email: 'admin1@gertrudes.com',
    password: 'Admin@2024!',
    full_name: 'Sarah Anderson',
    phone: '+254712345001',
    role: 'admin'
  },
  {
    email: 'admin2@gertrudes.com',
    password: 'Admin@2024!',
    full_name: 'James Kiprotich',
    phone: '+254712345002',
    role: 'admin'
  },
  
  // CAREGIVERS
  {
    email: 'caregiver1@gertrudes.com',
    password: 'Care@2024!',
    full_name: 'Mary Wanjiku',
    phone: '+254712345003',
    role: 'caregiver',
    address: '123 Kenyatta Avenue, Nairobi'
  },
  {
    email: 'caregiver2@gertrudes.com',
    password: 'Care@2024!',
    full_name: 'Peter Omondi',
    phone: '+254712345004',
    role: 'caregiver',
    address: '456 Moi Avenue, Nairobi'
  },
  
  // DOCTORS
  {
    email: 'doctor1@gertrudes.com',
    password: 'Doctor@2024!',
    full_name: 'Dr. Elizabeth Njeri',
    phone: '+254712345005',
    role: 'doctor',
    specialty: 'Pediatrician',
    bio: 'Specialized in pediatric care with 10+ years experience',
    photo_url: 'https://ui-avatars.com/api/?name=Elizabeth+Njeri&background=0D8ABC&color=fff'
  },
  {
    email: 'doctor2@gertrudes.com',
    password: 'Doctor@2024!',
    full_name: 'Dr. Michael Kamau',
    phone: '+254712345006',
    role: 'doctor',
    specialty: 'Pediatric Surgeon',
    bio: 'Expert in pediatric surgery and emergency care',
    photo_url: 'https://ui-avatars.com/api/?name=Michael+Kamau&background=0D8ABC&color=fff'
  },
  
  // LAB TECHNICIANS
  {
    email: 'labtech1@gertrudes.com',
    password: 'Lab@2024!',
    full_name: 'Grace Achieng',
    phone: '+254712345007',
    role: 'lab_tech',
    department: 'Hematology'
  },
  {
    email: 'labtech2@gertrudes.com',
    password: 'Lab@2024!',
    full_name: 'David Mwangi',
    phone: '+254712345008',
    role: 'lab_tech',
    department: 'Microbiology'
  },
  
  // PHARMACISTS
  {
    email: 'pharmacist1@gertrudes.com',
    password: 'Pharm@2024!',
    full_name: 'Lucy Mutua',
    phone: '+254712345009',
    role: 'pharmacist'
  },
  {
    email: 'pharmacist2@gertrudes.com',
    password: 'Pharm@2024!',
    full_name: 'John Otieno',
    phone: '+254712345010',
    role: 'pharmacist'
  },
  
  // SUPPLIERS
  {
    email: 'supplier1@gertrudes.com',
    password: 'Supply@2024!',
    full_name: 'Robert Kimani',
    phone: '+254712345011',
    role: 'supplier',
    company_name: 'MedSupply Kenya Ltd',
    contact_info: 'info@medsupply.co.ke, +254700123456'
  },
  {
    email: 'supplier2@gertrudes.com',
    password: 'Supply@2024!',
    full_name: 'Jane Muthoni',
    phone: '+254712345012',
    role: 'supplier',
    company_name: 'HealthCare Distributors',
    contact_info: 'sales@healthcare.co.ke, +254700654321'
  },
  
  // RECEPTIONISTS
  {
    email: 'receptionist1@gertrudes.com',
    password: 'Recept@2024!',
    full_name: 'Alice Nyambura',
    phone: '+254712345013',
    role: 'receptionist'
  },
  {
    email: 'receptionist2@gertrudes.com',
    password: 'Recept@2024!',
    full_name: 'Daniel Kariuki',
    phone: '+254712345014',
    role: 'receptionist'
  }
]

async function createProfile(userId, userData) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: userData.full_name,
      phone: userData.phone,
      role: userData.role
    })
  
  if (error) throw error
  return data
}

async function createRoleSpecificData(userId, userData) {
  let result = null
  
  switch (userData.role) {
    case 'caregiver':
      result = await supabase.from('caregivers').insert({
        id: userId,
        address: userData.address
      })
      break
      
    case 'doctor':
      result = await supabase.from('doctors').insert({
        id: userId,
        specialty: userData.specialty,
        bio: userData.bio,
        photo_url: userData.photo_url
      })
      break
      
    case 'lab_tech':
      result = await supabase.from('lab_technicians').insert({
        id: userId,
        department: userData.department
      })
      break
      
    case 'pharmacist':
      result = await supabase.from('pharmacists').insert({
        id: userId
      })
      break
      
    case 'supplier':
      result = await supabase.from('suppliers').insert({
        id: userId,
        company_name: userData.company_name,
        contact_info: userData.contact_info
      })
      break
      
    case 'receptionist':
      result = await supabase.from('receptionists').insert({
        id: userId
      })
      break
  }
  
  if (result && result.error) throw result.error
  return result
}

async function seedUsers() {
  console.log('🌱 Starting to seed dummy users...\n')
  
  let successCount = 0
  let errorCount = 0
  
  for (const userData of dummyUsers) {
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role
        }
      })

      if (authError) {
        console.error(`❌ Auth error for ${userData.email}:`, authError.message)
        errorCount++
        continue
      }

      const userId = authData.user.id
      
      // Step 2: Create profile
      await createProfile(userId, userData)
      
      // Step 3: Create role-specific data
      await createRoleSpecificData(userId, userData)
      
      console.log(`✅ Successfully created: ${userData.email} (${userData.role})`)
      successCount++
      
    } catch (err) {
      console.error(`❌ Failed to create ${userData.email}:`, err.message)
      errorCount++
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`   ✅ Successfully created: ${successCount} users`)
  console.log(`   ❌ Failed: ${errorCount} users`)
  console.log('\n📋 Login Credentials:')
  console.log('   All passwords follow the pattern: [Role]@2024!')
  console.log('   Example: admin1@gertrudes.com / Admin@2024!\n')
}

// Run the seeding
seedUsers()
  .then(() => {
    console.log('✨ Seeding completed!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err)
    process.exit(1)
  })