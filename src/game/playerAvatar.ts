import Vector4 from "../helper/vector4"
import Vector3 from "../helper/vector3"

export default interface PlayerAvatar{
    id: string
    velocity: Vector3
    position: Vector3
    rotation: Vector4
}