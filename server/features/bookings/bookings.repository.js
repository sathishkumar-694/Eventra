import { pool } from "../../database/db.js";

export const getUserBookingRepository = async(userId)=>
{
    const [result] = await pool.execute("SELECT * from bookings where user_id = ?" , [userId]) ;
    return result;
}

export const getBookingsByIdRepository = async(bookingId, userId)=>
{
    const [result] = await pool.execute("SELECT * from bookings where id = ? AND user_id = ?" , [bookingId, userId]) ;
    return result;
}

export const createBookingRepository  = async(bookingId , userId , eventId , seatsBooked)=>
{
    const [result] = await pool.execute("INSERT INTO bookings (id , user_id , event_id , ticket_count) VALUES (?,?,?,?)" , 
        [bookingId , userId , eventId , seatsBooked]
    );
    return result;
}

export const cancelBookingRepository = async(bookingId)=>
{
    const [result] = await pool.execute("UPDATE bookings SET booking_status = ? where id = ?" ,["CANCELLED" , bookingId] );
    return result;
}


export const decrementSeats = async(eventId , seats)=>
{
    const [result] = await pool.execute("UPDATE events SET available_seats = available_seats- ? where id = ? AND available_seats>=?" ,
        [seats ,eventId , seats]
     );
    return result;
}

export const incrementSeats = async(eventId, seats)=>
{
    const [result] = await pool.execute("UPDATE events SET available_seats = available_seats + ? WHERE id = ?",
        [seats, eventId]
    );
    return result;
}
