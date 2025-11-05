"use client"

import { useUser } from "@clerk/nextjs"

function Provider({children}) {

    const {user} = useUser();

    const createNewUser = async() => {

        let {data: User, error } = await supabase
        .from('Users')
        .select('*')
        .eq('email', user?.primaryEmailAddress.emailAddress)





    }

    return (
        <div>
            {children}
        </div>
    )
}

export default Provider;