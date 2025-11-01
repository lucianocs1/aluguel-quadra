using System;
using System.Security.Cryptography;
using System.Text;

namespace AluguelQuadra.Application.Services;

/// <summary>
/// Utilitário centralizado para gerar e validar hashes de senha com salt.
/// </summary>
public static class SenhaHelper
{
    public static string GerarHash(string senha)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var senhaBytes = Encoding.UTF8.GetBytes(senha);
        var hash = SHA256.HashData(Combinar(senhaBytes, salt));
        return Convert.ToHexString(salt) + ":" + Convert.ToHexString(hash);
    }

    public static bool Validar(string senha, string hashArmazenado)
    {
        var partes = hashArmazenado.Split(':');
        if (partes.Length != 2)
        {
            return false;
        }

        var salt = Convert.FromHexString(partes[0]);
        var hashEsperado = Convert.FromHexString(partes[1]);
        var senhaBytes = Encoding.UTF8.GetBytes(senha);
        var hashCalculado = SHA256.HashData(Combinar(senhaBytes, salt));
        return hashCalculado.AsSpan().SequenceEqual(hashEsperado);
    }

    private static byte[] Combinar(byte[] primeiraParte, byte[] segundaParte)
    {
        var resultado = new byte[primeiraParte.Length + segundaParte.Length];
        Buffer.BlockCopy(primeiraParte, 0, resultado, 0, primeiraParte.Length);
        Buffer.BlockCopy(segundaParte, 0, resultado, primeiraParte.Length, segundaParte.Length);
        return resultado;
    }
}
